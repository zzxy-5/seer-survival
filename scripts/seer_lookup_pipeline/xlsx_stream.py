from __future__ import annotations

import re
import posixpath
import zipfile
from collections.abc import Iterator, Mapping
from pathlib import Path
from xml.etree.ElementTree import fromstring, iterparse

REL_ID_ATTR = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"


def cell_ref_to_column_index(cell_ref: str) -> int:
    match = re.fullmatch(r"([A-Z]+)([1-9][0-9]*)?", cell_ref)
    if not match:
        raise ValueError(f"Invalid cell reference: {cell_ref}")
    value = 0
    for char in match.group(1):
        value = value * 26 + ord(char) - 64
    return value


def selected_column_indexes(headers: Mapping[int, str], required_columns: Mapping[str, str]) -> dict[int, str]:
    required_names = set(required_columns.values())
    selected = {index: name for index, name in headers.items() if name in required_names}
    missing = sorted(required_names - set(selected.values()))
    if missing:
        raise ValueError(f"Missing required source columns: {missing}")
    return selected


def _local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def _relationship_id(element) -> str | None:
    rid = element.attrib.get(REL_ID_ATTR)
    if rid:
        return rid
    for name, value in element.attrib.items():
        if _local_name(name) == "id":
            return value
    return None


def _children_by_local_name(element, name: str):
    return [child for child in list(element) if _local_name(child.tag) == name]


def _first_child_by_local_name(element, name: str):
    for child in list(element):
        if _local_name(child.tag) == name:
            return child
    return None


def _resolve_package_target(source_part: str, target: str) -> str:
    if target.startswith("/"):
        return target.lstrip("/")
    base = posixpath.dirname(source_part)
    return posixpath.normpath(posixpath.join(base, target))


def _read_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    try:
        shared_file = zf.open("xl/sharedStrings.xml")
    except KeyError:
        return []
    values: list[str] = []
    with shared_file:
        for _, elem in iterparse(shared_file, events=("end",)):
            if _local_name(elem.tag) == "si":
                values.append("".join(node.text or "" for node in elem.iter() if _local_name(node.tag) == "t"))
                elem.clear()
    return values


def _read_first_sheet_path(zf: zipfile.ZipFile) -> str:
    rels_root = fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    rels = {
        rel.attrib["Id"]: _resolve_package_target("xl/workbook.xml", rel.attrib["Target"])
        for rel in rels_root.iter()
        if _local_name(rel.tag) == "Relationship"
    }
    workbook_root = fromstring(zf.read("xl/workbook.xml"))
    sheet = next((node for node in workbook_root.iter() if _local_name(node.tag) == "sheet"), None)
    if sheet is None:
        raise ValueError("Workbook contains no worksheets")
    rid = _relationship_id(sheet)
    if rid is None:
        raise ValueError("Worksheet is missing relationship id")
    return rels[rid]


def _cell_text(cell, shared_strings: list[str]) -> str:
    cell_type = cell.attrib.get("t")
    if cell_type == "inlineStr":
        return "".join(node.text or "" for node in cell.iter() if _local_name(node.tag) == "t")
    value_node = _first_child_by_local_name(cell, "v")
    if value_node is None or value_node.text is None:
        return ""
    raw = value_node.text
    if cell_type == "s":
        index = int(raw)
        return shared_strings[index] if 0 <= index < len(shared_strings) else raw
    if cell_type == "b":
        return "TRUE" if raw == "1" else "FALSE"
    return raw


def iter_selected_rows(xlsx_path: str | Path, required_columns: Mapping[str, str]) -> Iterator[dict[str, str]]:
    with zipfile.ZipFile(xlsx_path) as zf:
        shared_strings = _read_shared_strings(zf)
        sheet_path = _read_first_sheet_path(zf)
        selected: dict[int, str] | None = None

        with zf.open(sheet_path) as sheet_file:
            context = iterparse(sheet_file, events=("start", "end"))
            _, root = next(context)
            for event, row in context:
                if event != "end" or _local_name(row.tag) != "row":
                    continue
                row_number = int(row.attrib.get("r", "0"))
                values_by_index: dict[int, str] = {}
                for cell in _children_by_local_name(row, "c"):
                    col_index = cell_ref_to_column_index(cell.attrib.get("r", ""))
                    values_by_index[col_index] = _cell_text(cell, shared_strings)

                if row_number == 1:
                    selected = selected_column_indexes(values_by_index, required_columns)
                elif selected is not None:
                    yield {header: values_by_index.get(index, "") for index, header in selected.items()}
                root.clear()
