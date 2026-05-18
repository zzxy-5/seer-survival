import tempfile
import unittest
import zipfile
from pathlib import Path

from scripts.seer_lookup_pipeline.xlsx_stream import cell_ref_to_column_index, iter_selected_rows, selected_column_indexes


class XlsxStreamTests(unittest.TestCase):
    def test_cell_ref_to_column_index(self):
        self.assertEqual(cell_ref_to_column_index("A1"), 1)
        self.assertEqual(cell_ref_to_column_index("Z9"), 26)
        self.assertEqual(cell_ref_to_column_index("AA10"), 27)
        self.assertEqual(cell_ref_to_column_index("TY40867"), 545)

    def test_cell_ref_to_column_index_rejects_invalid_refs(self):
        for cell_ref in ["", "A!", "A1B", "AA-2", "1A", "A0"]:
            with self.assertRaises(ValueError):
                cell_ref_to_column_index(cell_ref)

    def test_selected_column_indexes(self):
        headers = {
            1: "Sex",
            2: "Year of diagnosis",
            3: "Survival months",
        }
        required = {"sex": "Sex", "survival_months": "Survival months"}

        self.assertEqual(selected_column_indexes(headers, required), {1: "Sex", 3: "Survival months"})

    def test_iter_selected_rows_reads_shared_strings(self):
        with tempfile.TemporaryDirectory() as tmp:
            xlsx_path = Path(tmp) / "sample.xlsx"
            self._write_minimal_xlsx(xlsx_path)

            rows = list(iter_selected_rows(xlsx_path, {"sex": "Sex", "survival_months": "Survival months"}))

        self.assertEqual(rows, [{"Sex": "Male", "Survival months": "12"}])

    def test_iter_selected_rows_resolves_absolute_relationship_target(self):
        with tempfile.TemporaryDirectory() as tmp:
            xlsx_path = Path(tmp) / "sample.xlsx"
            self._write_minimal_xlsx(xlsx_path, target="/xl/worksheets/sheet1.xml")

            rows = list(iter_selected_rows(xlsx_path, {"sex": "Sex"}))

        self.assertEqual(rows, [{"Sex": "Male"}])

    def test_iter_selected_rows_reads_inline_strings_and_sparse_blanks(self):
        with tempfile.TemporaryDirectory() as tmp:
            xlsx_path = Path(tmp) / "sample.xlsx"
            self._write_minimal_xlsx(xlsx_path, include_shared_strings=False, inline_strings=True, omit_survival_value=True)

            rows = list(iter_selected_rows(xlsx_path, {"sex": "Sex", "survival_months": "Survival months"}))

        self.assertEqual(rows, [{"Sex": "Male", "Survival months": ""}])

    def test_iter_selected_rows_handles_strict_spreadsheet_namespace(self):
        with tempfile.TemporaryDirectory() as tmp:
            xlsx_path = Path(tmp) / "sample.xlsx"
            self._write_minimal_xlsx(
                xlsx_path,
                spreadsheet_ns="http://purl.oclc.org/ooxml/spreadsheetml/main",
                relationship_ns="http://purl.oclc.org/ooxml/officeDocument/relationships",
            )

            rows = list(iter_selected_rows(xlsx_path, {"sex": "Sex"}))

        self.assertEqual(rows, [{"Sex": "Male"}])

    def test_iter_selected_rows_reports_missing_required_column(self):
        with tempfile.TemporaryDirectory() as tmp:
            xlsx_path = Path(tmp) / "sample.xlsx"
            self._write_minimal_xlsx(xlsx_path)

            with self.assertRaisesRegex(ValueError, "Missing required source columns"):
                list(iter_selected_rows(xlsx_path, {"age": "Age at diagnosis"}))

    def _write_minimal_xlsx(
        self,
        path,
        target="worksheets/sheet1.xml",
        include_shared_strings=True,
        inline_strings=False,
        omit_survival_value=False,
        spreadsheet_ns="http://schemas.openxmlformats.org/spreadsheetml/2006/main",
        relationship_ns="http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    ):
        shared_strings = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="3" uniqueCount="3">
  <si><t>Sex</t></si>
  <si><t>Survival months</t></si>
  <si><t>Male</t></si>
</sst>"""
        workbook = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="{spreadsheet_ns}"
 xmlns:r="{relationship_ns}">
  <sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>
</workbook>"""
        rels = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="{target}"/>
</Relationships>"""
        if inline_strings:
            header_cells = """<c r="A1" t="inlineStr"><is><t>Sex</t></is></c><c r="B1" t="inlineStr"><is><t>Survival months</t></is></c>"""
            data_cells = """<c r="A2" t="inlineStr"><is><t>Male</t></is></c>"""
            if not omit_survival_value:
                data_cells += """<c r="B2"><v>12</v></c>"""
        else:
            header_cells = """<c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c>"""
            data_cells = """<c r="A2" t="s"><v>2</v></c>"""
            if not omit_survival_value:
                data_cells += """<c r="B2"><v>12</v></c>"""
        sheet = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="{spreadsheet_ns}">
  <sheetData>
    <row r="1">{header_cells}</row>
    <row r="2">{data_cells}</row>
  </sheetData>
</worksheet>"""
        with zipfile.ZipFile(path, "w") as zf:
            if include_shared_strings:
                zf.writestr("xl/sharedStrings.xml", shared_strings)
            zf.writestr("xl/workbook.xml", workbook)
            zf.writestr("xl/_rels/workbook.xml.rels", rels)
            zf.writestr("xl/worksheets/sheet1.xml", sheet)


if __name__ == "__main__":
    unittest.main()
