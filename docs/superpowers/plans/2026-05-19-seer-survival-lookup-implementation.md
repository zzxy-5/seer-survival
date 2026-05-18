# SEER Survival Lookup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a research-display website that returns precomputed Kaplan-Meier overall survival estimates from SEER-like case groups using runtime lookup only.

**Architecture:** A Python offline pipeline streams `统计表.xlsx`, normalizes selected fields, computes Kaplan-Meier rows for several matching levels, and writes static JSON artifacts. A Vite React frontend loads those JSON files and performs deterministic lookup/fallback in the browser; no server-side model, Cox model, machine-learning inference, or AI reasoning is used at runtime.

**Tech Stack:** Python 3 standard library for data extraction/statistics, `unittest` for Python tests, TypeScript + React + Vite for the static website, Vitest for frontend logic tests, inline SVG for survival curves.

---

## File Structure

- Create `scripts/seer_lookup_pipeline/schema.py`: canonical source column names, output dataclasses, matching-level constants.
- Create `scripts/seer_lookup_pipeline/normalization.py`: age grouping, coarse age grouping, TNM parsing, event/time parsing, key building.
- Create `scripts/seer_lookup_pipeline/xlsx_stream.py`: dependency-light streaming XLSX reader that extracts only required columns.
- Create `scripts/seer_lookup_pipeline/km.py`: Kaplan-Meier calculation and survival-at-horizon helpers.
- Create `scripts/seer_lookup_pipeline/lookup_builder.py`: group records by matching levels and emit lookup rows.
- Create `scripts/seer_lookup_pipeline/validation.py`: artifact validation checks for monotonic curves, valid probabilities, required fallback coverage.
- Create `scripts/build_lookup.py`: CLI entry point that reads the workbook and writes JSON artifacts.
- Create `tests/python/test_normalization.py`: unit tests for age groups and TNM normalization.
- Create `tests/python/test_km.py`: unit tests for Kaplan-Meier calculations.
- Create `tests/python/test_lookup_builder.py`: unit tests for matching levels and fallback-ready rows.
- Modify `.gitignore`: ignore raw data directories while allowing generated public JSON when intentionally committed.
- Create `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`: frontend project shell.
- Create `src/data/types.ts`: TypeScript types matching generated JSON.
- Create `src/data/age.ts`: browser age-group mapping.
- Create `src/data/lookup.ts`: deterministic lookup and fallback logic.
- Create `src/data/format.ts`: display formatting for survival rates and median survival.
- Create `src/components/InputPanel.tsx`: controlled form for sex, site, histology group, age, T/N/M.
- Create `src/components/ResultSummary.tsx`: KPI cards and matching-level notices.
- Create `src/components/SurvivalCurve.tsx`: inline SVG Kaplan-Meier curve.
- Create `src/components/MethodPanel.tsx`: research-use method and limitation text.
- Create `src/App.tsx`, `src/main.tsx`, `src/styles.css`: static app composition and polished layout.
- Create `src/data/lookup.test.ts`, `src/data/age.test.ts`: frontend tests for lookup-only behavior.
- Create `public/data/options.json`, `public/data/survival_lookup.json`, `public/data/metadata.json`: generated artifacts from the offline pipeline.
- Modify `README.md`: document setup, data placement, build commands, and research-only limitation.

---

## Task 1: Repository Skeleton And Commands

**Files:**
- Modify: `.gitignore`
- Modify: `README.md`
- Create: `scripts/seer_lookup_pipeline/__init__.py`
- Create: `tests/python/__init__.py`
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`

- [ ] **Step 1: Extend ignore rules for raw data and local generated scratch**

Patch `.gitignore` so raw workbook copies can live under `data/raw/` without being committed, while generated `public/data/*.json` remains commit-eligible:

```gitignore
# Local raw data directories
data/raw/
data/processed/
```

- [ ] **Step 2: Create Python package markers**

Create `scripts/seer_lookup_pipeline/__init__.py`:

```python
"""Offline SEER survival lookup generation pipeline."""
```

Create `tests/python/__init__.py`:

```python
"""Python unit tests for the SEER lookup pipeline."""
```

- [ ] **Step 3: Create frontend package scripts**

Create `package.json`:

```json
{
  "name": "seer-survival",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 127.0.0.1",
    "test": "vitest run",
    "test:py": "python3 -m unittest discover -s tests/python -p 'test_*.py'",
    "build:data": "python3 scripts/build_lookup.py --input 统计表.xlsx --output public/data"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "^5.7.0",
    "vite": "^7.0.0",
    "vitest": "^2.1.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}
```

- [ ] **Step 4: Create TypeScript and Vite config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": []
}
```

Create `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
});
```

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SEER Survival Lookup</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Run repository baseline checks**

Run:

```bash
git status --short
```

Expected: only the files from this task are untracked or modified.

- [ ] **Step 6: Commit skeleton**

Run:

```bash
git add .gitignore README.md package.json tsconfig.json vite.config.ts index.html scripts/seer_lookup_pipeline/__init__.py tests/python/__init__.py
git commit -m "chore: add project skeleton"
```

---

## Task 2: Normalization Library

**Files:**
- Create: `scripts/seer_lookup_pipeline/schema.py`
- Create: `scripts/seer_lookup_pipeline/normalization.py`
- Create: `tests/python/test_normalization.py`

- [ ] **Step 1: Write failing normalization tests**

Create `tests/python/test_normalization.py`:

```python
import unittest

from scripts.seer_lookup_pipeline.normalization import (
    age_group,
    coarse_age_group,
    normalize_m_stage,
    normalize_n_stage,
    normalize_t_stage,
    parse_event,
    parse_survival_months,
)


class NormalizationTests(unittest.TestCase):
    def test_age_group_boundaries(self):
        self.assertEqual(age_group("39"), "<40")
        self.assertEqual(age_group("40"), "40-49")
        self.assertEqual(age_group("59"), "50-59")
        self.assertEqual(age_group("60"), "60-69")
        self.assertEqual(age_group("79"), "70-79")
        self.assertEqual(age_group("80"), "80+")

    def test_coarse_age_group_boundaries(self):
        self.assertEqual(coarse_age_group("59"), "<60")
        self.assertEqual(coarse_age_group("60"), "60-69")
        self.assertEqual(coarse_age_group("70"), "70+")

    def test_tnm_substages_collapse_to_major_stage(self):
        self.assertEqual(normalize_t_stage("T2a"), "T2")
        self.assertEqual(normalize_t_stage("cT4b"), "T4")
        self.assertEqual(normalize_n_stage("N2c"), "N2")
        self.assertEqual(normalize_m_stage("M1a"), "M1")

    def test_tnm_unknown_values(self):
        for raw in ["", "Blank(s)", "N/A", "Not applicable", "88"]:
            self.assertEqual(normalize_t_stage(raw), "Unknown")
            self.assertEqual(normalize_n_stage(raw), "Unknown")
            self.assertEqual(normalize_m_stage(raw), "Unknown")

    def test_survival_and_event_parsing(self):
        self.assertEqual(parse_survival_months("0"), 0)
        self.assertEqual(parse_survival_months("83"), 83)
        self.assertTrue(parse_event("Dead"))
        self.assertFalse(parse_event("Alive"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
python3 -m unittest tests/python/test_normalization.py -v
```

Expected: FAIL because `scripts.seer_lookup_pipeline.normalization` does not exist.

- [ ] **Step 3: Implement schema constants**

Create `scripts/seer_lookup_pipeline/schema.py`:

```python
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

MatchingLevel = Literal[
    "full",
    "no_sex",
    "no_histology",
    "coarse_age",
    "site_tnm",
    "site_m",
    "site_only",
]

ANY_VALUE = "Any"
UNKNOWN_VALUE = "Unknown"

SOURCE_COLUMNS = {
    "sex": "Sex",
    "year": "Year of diagnosis",
    "site": "Site recode ICD-O-3/WHO 2008",
    "histology_group": "Histology recode - broad groupings",
    "survival_months": "Survival months",
    "vital_status": "Vital status recode (study cutoff used)",
    "age": "Age at diagnosis",
    "ajcc_t_7": "Derived AJCC T, 7th ed (2010-2015)",
    "ajcc_n_7": "Derived AJCC N, 7th ed (2010-2015)",
    "ajcc_m_7": "Derived AJCC M, 7th ed (2010-2015)",
    "seer_t_2016": "Derived SEER Combined T (2016+)",
    "seer_n_2016": "Derived SEER Combined N (2016+)",
    "seer_m_2016": "Derived SEER Combined M (2016+)",
}


@dataclass(frozen=True)
class NormalizedRecord:
    sex: str
    site: str
    histology_group: str
    age_group: str
    coarse_age_group: str
    t_stage: str
    n_stage: str
    m_stage: str
    survival_months: int
    event: bool


@dataclass(frozen=True)
class LookupKey:
    matching_level: MatchingLevel
    sex: str
    site: str
    histology_group: str
    age_group: str
    t_stage: str
    n_stage: str
    m_stage: str
```

- [ ] **Step 4: Implement normalization**

Create `scripts/seer_lookup_pipeline/normalization.py`:

```python
from __future__ import annotations

import re
from collections.abc import Mapping

from .schema import ANY_VALUE, SOURCE_COLUMNS, UNKNOWN_VALUE, LookupKey, MatchingLevel, NormalizedRecord


def parse_survival_months(value: str) -> int:
    text = str(value).strip()
    if text == "":
        raise ValueError("Survival months is blank")
    months = int(float(text))
    if months < 0:
        raise ValueError(f"Survival months must be non-negative: {value}")
    return months


def parse_event(vital_status: str) -> bool:
    text = str(vital_status).strip()
    if text == "Dead":
        return True
    if text == "Alive":
        return False
    raise ValueError(f"Unsupported vital status: {vital_status}")


def age_group(age: str) -> str:
    value = int(float(str(age).strip()))
    if value < 40:
        return "<40"
    if value < 50:
        return "40-49"
    if value < 60:
        return "50-59"
    if value < 70:
        return "60-69"
    if value < 80:
        return "70-79"
    return "80+"


def coarse_age_group(age: str) -> str:
    value = int(float(str(age).strip()))
    if value < 60:
        return "<60"
    if value < 70:
        return "60-69"
    return "70+"


def _normalize_stage(raw: str, prefix: str, allowed: set[str]) -> str:
    text = str(raw).strip()
    if text in {"", "Blank(s)", "N/A", "Not applicable", "Unknown", "88", "99"}:
        return UNKNOWN_VALUE
    text = text.upper().replace(" ", "")
    text = re.sub(r"^[CPY]+", "", text)
    match = re.match(rf"^({prefix}[0-4X])", text)
    if not match:
        return UNKNOWN_VALUE
    stage = match.group(1)
    return stage if stage in allowed else UNKNOWN_VALUE


def normalize_t_stage(raw: str) -> str:
    return _normalize_stage(raw, "T", {"T0", "T1", "T2", "T3", "T4", "TX"})


def normalize_n_stage(raw: str) -> str:
    return _normalize_stage(raw, "N", {"N0", "N1", "N2", "N3", "NX"})


def normalize_m_stage(raw: str) -> str:
    return _normalize_stage(raw, "M", {"M0", "M1", "MX"})


def choose_tnm_source(row: Mapping[str, str]) -> tuple[str, str, str]:
    year = int(float(row[SOURCE_COLUMNS["year"]]))
    if year >= 2016:
        return (
            row.get(SOURCE_COLUMNS["seer_t_2016"], ""),
            row.get(SOURCE_COLUMNS["seer_n_2016"], ""),
            row.get(SOURCE_COLUMNS["seer_m_2016"], ""),
        )
    return (
        row.get(SOURCE_COLUMNS["ajcc_t_7"], ""),
        row.get(SOURCE_COLUMNS["ajcc_n_7"], ""),
        row.get(SOURCE_COLUMNS["ajcc_m_7"], ""),
    )


def normalize_record(row: Mapping[str, str]) -> NormalizedRecord:
    t_raw, n_raw, m_raw = choose_tnm_source(row)
    age = row[SOURCE_COLUMNS["age"]]
    return NormalizedRecord(
        sex=row[SOURCE_COLUMNS["sex"]].strip() or UNKNOWN_VALUE,
        site=row[SOURCE_COLUMNS["site"]].strip() or UNKNOWN_VALUE,
        histology_group=row[SOURCE_COLUMNS["histology_group"]].strip() or UNKNOWN_VALUE,
        age_group=age_group(age),
        coarse_age_group=coarse_age_group(age),
        t_stage=normalize_t_stage(t_raw),
        n_stage=normalize_n_stage(n_raw),
        m_stage=normalize_m_stage(m_raw),
        survival_months=parse_survival_months(row[SOURCE_COLUMNS["survival_months"]]),
        event=parse_event(row[SOURCE_COLUMNS["vital_status"]]),
    )


def key_to_string(key: LookupKey) -> str:
    parts = [
        key.matching_level,
        key.sex,
        key.site,
        key.histology_group,
        key.age_group,
        key.t_stage,
        key.n_stage,
        key.m_stage,
    ]
    return "|".join(parts)


def matching_keys(record: NormalizedRecord) -> list[LookupKey]:
    return [
        LookupKey("full", record.sex, record.site, record.histology_group, record.age_group, record.t_stage, record.n_stage, record.m_stage),
        LookupKey("no_sex", ANY_VALUE, record.site, record.histology_group, record.age_group, record.t_stage, record.n_stage, record.m_stage),
        LookupKey("no_histology", ANY_VALUE, record.site, ANY_VALUE, record.age_group, record.t_stage, record.n_stage, record.m_stage),
        LookupKey("coarse_age", ANY_VALUE, record.site, ANY_VALUE, record.coarse_age_group, record.t_stage, record.n_stage, record.m_stage),
        LookupKey("site_tnm", ANY_VALUE, record.site, ANY_VALUE, ANY_VALUE, record.t_stage, record.n_stage, record.m_stage),
        LookupKey("site_m", ANY_VALUE, record.site, ANY_VALUE, ANY_VALUE, UNKNOWN_VALUE, UNKNOWN_VALUE, record.m_stage),
        LookupKey("site_only", ANY_VALUE, record.site, ANY_VALUE, ANY_VALUE, UNKNOWN_VALUE, UNKNOWN_VALUE, UNKNOWN_VALUE),
    ]
```

- [ ] **Step 5: Run tests and verify pass**

Run:

```bash
python3 -m unittest tests/python/test_normalization.py -v
```

Expected: PASS with 5 tests.

- [ ] **Step 6: Commit normalization**

Run:

```bash
git add scripts/seer_lookup_pipeline/schema.py scripts/seer_lookup_pipeline/normalization.py tests/python/test_normalization.py
git commit -m "feat: add SEER field normalization"
```

---

## Task 3: Kaplan-Meier Calculator

**Files:**
- Create: `scripts/seer_lookup_pipeline/km.py`
- Create: `tests/python/test_km.py`

- [ ] **Step 1: Write failing KM tests**

Create `tests/python/test_km.py`:

```python
import unittest

from scripts.seer_lookup_pipeline.km import kaplan_meier


class KaplanMeierTests(unittest.TestCase):
    def test_curve_uses_censoring_without_survival_drop(self):
        result = kaplan_meier([(1, True), (2, False), (3, True), (4, False)])
        self.assertEqual(result.sample_size, 4)
        self.assertEqual(result.event_count, 2)
        self.assertEqual(result.censor_count, 2)
        self.assertEqual(result.curve_months, [0, 1, 3])
        self.assertAlmostEqual(result.curve_survival_probs[0], 1.0)
        self.assertAlmostEqual(result.curve_survival_probs[1], 0.75)
        self.assertAlmostEqual(result.curve_survival_probs[2], 0.375)
        self.assertEqual(result.median_survival_months, 3)

    def test_median_not_reached(self):
        result = kaplan_meier([(10, False), (20, True), (30, False)])
        self.assertIsNone(result.median_survival_months)
        self.assertGreater(result.survival_12m, 0.0)
        self.assertGreater(result.survival_36m, 0.0)

    def test_zero_month_event_is_supported(self):
        result = kaplan_meier([(0, True), (5, False)])
        self.assertEqual(result.curve_months[1], 0)
        self.assertAlmostEqual(result.curve_survival_probs[1], 0.5)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
python3 -m unittest tests/python/test_km.py -v
```

Expected: FAIL because `scripts.seer_lookup_pipeline.km` does not exist.

- [ ] **Step 3: Implement KM calculation**

Create `scripts/seer_lookup_pipeline/km.py`:

```python
from __future__ import annotations

from collections import Counter
from dataclasses import dataclass


@dataclass(frozen=True)
class KMResult:
    sample_size: int
    event_count: int
    censor_count: int
    median_survival_months: int | None
    survival_12m: float
    survival_36m: float
    survival_60m: float
    curve_months: list[int]
    curve_survival_probs: list[float]


def _survival_at(curve_months: list[int], curve_survival_probs: list[float], horizon: int) -> float:
    value = 1.0
    for month, probability in zip(curve_months, curve_survival_probs):
        if month <= horizon:
            value = probability
        else:
            break
    return value


def kaplan_meier(observations: list[tuple[int, bool]]) -> KMResult:
    if not observations:
        raise ValueError("Kaplan-Meier requires at least one observation")

    event_counts = Counter(month for month, event in observations if event)
    censor_counts = Counter(month for month, event in observations if not event)
    months = sorted(set(event_counts) | set(censor_counts))
    sample_size = len(observations)
    at_risk = sample_size
    survival = 1.0
    curve_months = [0]
    curve_survival_probs = [1.0]
    median = None

    for month in months:
        events = event_counts[month]
        censored = censor_counts[month]
        if events:
            survival *= 1.0 - (events / at_risk)
            curve_months.append(month)
            curve_survival_probs.append(round(survival, 6))
            if median is None and survival <= 0.5:
                median = month
        at_risk -= events + censored
        if at_risk <= 0:
            break

    return KMResult(
        sample_size=sample_size,
        event_count=sum(event_counts.values()),
        censor_count=sum(censor_counts.values()),
        median_survival_months=median,
        survival_12m=round(_survival_at(curve_months, curve_survival_probs, 12), 6),
        survival_36m=round(_survival_at(curve_months, curve_survival_probs, 36), 6),
        survival_60m=round(_survival_at(curve_months, curve_survival_probs, 60), 6),
        curve_months=curve_months,
        curve_survival_probs=curve_survival_probs,
    )
```

- [ ] **Step 4: Run KM tests and full Python tests**

Run:

```bash
python3 -m unittest tests/python/test_km.py -v
python3 -m unittest discover -s tests/python -p 'test_*.py' -v
```

Expected: all tests PASS.

- [ ] **Step 5: Commit KM calculator**

Run:

```bash
git add scripts/seer_lookup_pipeline/km.py tests/python/test_km.py
git commit -m "feat: add Kaplan-Meier calculator"
```

---

## Task 4: Streaming XLSX Extraction

**Files:**
- Create: `scripts/seer_lookup_pipeline/xlsx_stream.py`
- Create: `tests/python/test_xlsx_stream.py`

- [ ] **Step 1: Write focused tests for header selection**

Create `tests/python/test_xlsx_stream.py`:

```python
import unittest

from scripts.seer_lookup_pipeline.xlsx_stream import cell_ref_to_column_index, selected_column_indexes


class XlsxStreamTests(unittest.TestCase):
    def test_cell_ref_to_column_index(self):
        self.assertEqual(cell_ref_to_column_index("A1"), 1)
        self.assertEqual(cell_ref_to_column_index("Z9"), 26)
        self.assertEqual(cell_ref_to_column_index("AA10"), 27)
        self.assertEqual(cell_ref_to_column_index("TY40867"), 545)

    def test_selected_column_indexes(self):
        headers = {
            1: "Sex",
            2: "Year of diagnosis",
            3: "Survival months",
        }
        required = {"sex": "Sex", "survival_months": "Survival months"}
        self.assertEqual(selected_column_indexes(headers, required), {1: "Sex", 3: "Survival months"})


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
python3 -m unittest tests/python/test_xlsx_stream.py -v
```

Expected: FAIL because `xlsx_stream.py` does not exist.

- [ ] **Step 3: Implement streaming reader**

Create `scripts/seer_lookup_pipeline/xlsx_stream.py`:

```python
from __future__ import annotations

import re
import zipfile
from collections.abc import Iterator, Mapping
from pathlib import Path
from xml.etree.ElementTree import fromstring, iterparse

XLSX_NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
PKG_REL_NS = "{http://schemas.openxmlformats.org/package/2006/relationships}"
REL_ID_ATTR = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"


def cell_ref_to_column_index(cell_ref: str) -> int:
    match = re.match(r"([A-Z]+)", cell_ref)
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


def _read_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    try:
        data = zf.read("xl/sharedStrings.xml")
    except KeyError:
        return []
    root = fromstring(data)
    values: list[str] = []
    for si in root.findall(f"{XLSX_NS}si"):
        parts = []
        for node in si.iter():
            if _local_name(node.tag) == "t" and node.text:
                parts.append(node.text)
        values.append("".join(parts))
    return values


def _read_first_sheet_path(zf: zipfile.ZipFile) -> str:
    rels_root = fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    rels = {
        rel.attrib["Id"]: "xl/" + rel.attrib["Target"].lstrip("/")
        for rel in rels_root.findall(f"{PKG_REL_NS}Relationship")
    }
    workbook_root = fromstring(zf.read("xl/workbook.xml"))
    sheet = workbook_root.find(f".//{XLSX_NS}sheet")
    if sheet is None:
        raise ValueError("Workbook contains no worksheets")
    return rels[sheet.attrib[REL_ID_ATTR]]


def _cell_text(cell, shared_strings: list[str]) -> str:
    cell_type = cell.attrib.get("t")
    if cell_type == "inlineStr":
        return "".join(node.text or "" for node in cell.iter() if _local_name(node.tag) == "t")
    value_node = cell.find(f"{XLSX_NS}v")
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
        headers: dict[int, str] = {}
        selected: dict[int, str] | None = None

        with zf.open(sheet_path) as sheet_file:
            for event, row in iterparse(sheet_file, events=("end",)):
                if _local_name(row.tag) != "row":
                    continue
                row_number = int(row.attrib.get("r", "0"))
                values_by_index: dict[int, str] = {}
                for cell in row.findall(f"{XLSX_NS}c"):
                    col_index = cell_ref_to_column_index(cell.attrib.get("r", ""))
                    values_by_index[col_index] = _cell_text(cell, shared_strings)

                if row_number == 1:
                    headers = values_by_index
                    selected = selected_column_indexes(headers, required_columns)
                elif selected is not None:
                    yield {header: values_by_index.get(index, "") for index, header in selected.items()}
                row.clear()
```

- [ ] **Step 4: Run extraction tests and full Python tests**

Run:

```bash
python3 -m unittest tests/python/test_xlsx_stream.py -v
python3 -m unittest discover -s tests/python -p 'test_*.py' -v
```

Expected: all tests PASS.

- [ ] **Step 5: Commit streaming extraction**

Run:

```bash
git add scripts/seer_lookup_pipeline/xlsx_stream.py tests/python/test_xlsx_stream.py
git commit -m "feat: add streaming XLSX extraction"
```

---

## Task 5: Lookup Builder And Validation

**Files:**
- Create: `scripts/seer_lookup_pipeline/lookup_builder.py`
- Create: `scripts/seer_lookup_pipeline/validation.py`
- Create: `tests/python/test_lookup_builder.py`

- [ ] **Step 1: Write failing lookup builder tests**

Create `tests/python/test_lookup_builder.py`:

```python
import unittest

from scripts.seer_lookup_pipeline.lookup_builder import build_lookup_artifact
from scripts.seer_lookup_pipeline.schema import NormalizedRecord
from scripts.seer_lookup_pipeline.validation import validate_lookup_artifact


def record(sex="Male", site="Tongue", histology="8050-8089: squamous cell neoplasms", age_group="60-69", coarse="60-69", t="T2", n="N1", m="M0", months=12, event=True):
    return NormalizedRecord(
        sex=sex,
        site=site,
        histology_group=histology,
        age_group=age_group,
        coarse_age_group=coarse,
        t_stage=t,
        n_stage=n,
        m_stage=m,
        survival_months=months,
        event=event,
    )


class LookupBuilderTests(unittest.TestCase):
    def test_artifact_contains_all_matching_levels(self):
        records = [
            record(months=6, event=True),
            record(months=18, event=False),
            record(sex="Female", months=24, event=True),
        ]
        artifact = build_lookup_artifact(records)
        levels = {row["matching_level"] for row in artifact["rows"]}
        self.assertIn("full", levels)
        self.assertIn("no_sex", levels)
        self.assertIn("site_only", levels)
        validate_lookup_artifact(artifact)

    def test_index_points_to_rows(self):
        artifact = build_lookup_artifact([record(months=6, event=True), record(months=10, event=False)])
        for key, index in artifact["index"].items():
            self.assertIsInstance(key, str)
            self.assertEqual(artifact["rows"][index]["key"], key)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
python3 -m unittest tests/python/test_lookup_builder.py -v
```

Expected: FAIL because `lookup_builder.py` and `validation.py` do not exist.

- [ ] **Step 3: Implement lookup builder**

Create `scripts/seer_lookup_pipeline/lookup_builder.py`:

```python
from __future__ import annotations

from collections import defaultdict
from datetime import UTC, datetime
from typing import Any

from .km import kaplan_meier
from .normalization import key_to_string, matching_keys
from .schema import LookupKey, NormalizedRecord


def _row_from_group(key: LookupKey, observations: list[tuple[int, bool]]) -> dict[str, Any]:
    km = kaplan_meier(observations)
    quality = "stable" if km.sample_size >= 50 else "small_sample" if km.sample_size >= 20 else "very_small_sample"
    key_string = key_to_string(key)
    return {
        "key": key_string,
        "matching_level": key.matching_level,
        "sex": key.sex,
        "site": key.site,
        "histology_group": key.histology_group,
        "age_group": key.age_group,
        "t_stage": key.t_stage,
        "n_stage": key.n_stage,
        "m_stage": key.m_stage,
        "sample_size": km.sample_size,
        "event_count": km.event_count,
        "censor_count": km.censor_count,
        "median_survival_months": km.median_survival_months,
        "survival_12m": km.survival_12m,
        "survival_36m": km.survival_36m,
        "survival_60m": km.survival_60m,
        "curve_months": km.curve_months,
        "curve_survival_probs": km.curve_survival_probs,
        "data_quality_flag": quality,
    }


def build_lookup_artifact(records: list[NormalizedRecord]) -> dict[str, Any]:
    grouped: dict[LookupKey, list[tuple[int, bool]]] = defaultdict(list)
    sites = set()
    sexes = set()
    histology_groups = set()
    for rec in records:
        sites.add(rec.site)
        sexes.add(rec.sex)
        histology_groups.add(rec.histology_group)
        for key in matching_keys(rec):
            grouped[key].append((rec.survival_months, rec.event))

    rows = [_row_from_group(key, observations) for key, observations in grouped.items()]
    rows.sort(key=lambda row: (row["matching_level"], row["site"], row["sample_size"] * -1, row["key"]))
    index = {row["key"]: position for position, row in enumerate(rows)}

    return {
        "version": 1,
        "generated_at": datetime.now(UTC).isoformat(),
        "thresholds": {"minimum_sample": 20, "stable_sample": 50},
        "rows": rows,
        "index": index,
        "summary": {
            "record_count": len(records),
            "row_count": len(rows),
            "sites": sorted(sites),
            "sexes": sorted(sexes),
            "histology_groups": sorted(histology_groups),
        },
    }
```

- [ ] **Step 4: Implement validation**

Create `scripts/seer_lookup_pipeline/validation.py`:

```python
from __future__ import annotations

from typing import Any


def _assert_probability(value: float, field: str) -> None:
    if not 0.0 <= value <= 1.0:
        raise ValueError(f"{field} must be between 0 and 1: {value}")


def validate_lookup_artifact(artifact: dict[str, Any]) -> None:
    rows = artifact["rows"]
    index = artifact["index"]
    if len(index) != len(rows):
        raise ValueError("Lookup index and rows length mismatch")

    for position, row in enumerate(rows):
        if index[row["key"]] != position:
            raise ValueError(f"Index points to wrong row for {row['key']}")
        if row["sample_size"] != row["event_count"] + row["censor_count"]:
            raise ValueError(f"Sample count mismatch for {row['key']}")
        for field in ["survival_12m", "survival_36m", "survival_60m"]:
            _assert_probability(row[field], field)
        probs = row["curve_survival_probs"]
        months = row["curve_months"]
        if len(probs) != len(months):
            raise ValueError(f"Curve length mismatch for {row['key']}")
        if months[0] != 0 or probs[0] != 1.0:
            raise ValueError(f"Curve must start at month 0 with survival 1.0 for {row['key']}")
        for previous, current in zip(probs, probs[1:]):
            if current > previous:
                raise ValueError(f"KM curve must be monotonic non-increasing for {row['key']}")
        for previous, current in zip(months, months[1:]):
            if current < previous:
                raise ValueError(f"Curve months must be sorted for {row['key']}")
```

- [ ] **Step 5: Run builder tests and full Python tests**

Run:

```bash
python3 -m unittest tests/python/test_lookup_builder.py -v
python3 -m unittest discover -s tests/python -p 'test_*.py' -v
```

Expected: all tests PASS.

- [ ] **Step 6: Commit builder and validation**

Run:

```bash
git add scripts/seer_lookup_pipeline/lookup_builder.py scripts/seer_lookup_pipeline/validation.py tests/python/test_lookup_builder.py
git commit -m "feat: build validated survival lookup artifacts"
```

---

## Task 6: Offline Build CLI And JSON Artifacts

**Files:**
- Create: `scripts/build_lookup.py`
- Create: `public/data/.gitkeep`
- Generated: `public/data/options.json`
- Generated: `public/data/survival_lookup.json`
- Generated: `public/data/metadata.json`
- Modify: `README.md`

- [ ] **Step 1: Create CLI script**

Create `scripts/build_lookup.py`:

```python
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from seer_lookup_pipeline.lookup_builder import build_lookup_artifact
from seer_lookup_pipeline.normalization import normalize_record
from seer_lookup_pipeline.schema import SOURCE_COLUMNS
from seer_lookup_pipeline.validation import validate_lookup_artifact
from seer_lookup_pipeline.xlsx_stream import iter_selected_rows


def build_options(artifact: dict[str, Any]) -> dict[str, Any]:
    rows = artifact["rows"]
    return {
        "sexes": sorted({row["sex"] for row in rows if row["sex"] not in {"Any"}}),
        "sites": artifact["summary"]["sites"],
        "histology_groups": artifact["summary"]["histology_groups"],
        "age_groups": ["<40", "40-49", "50-59", "60-69", "70-79", "80+"],
        "t_stages": ["T0", "T1", "T2", "T3", "T4", "TX", "Unknown"],
        "n_stages": ["N0", "N1", "N2", "N3", "NX", "Unknown"],
        "m_stages": ["M0", "M1", "MX", "Unknown"],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Build static SEER survival lookup artifacts.")
    parser.add_argument("--input", required=True, help="Path to source .xlsx workbook")
    parser.add_argument("--output", required=True, help="Directory for generated JSON files")
    args = parser.parse_args()

    records = []
    skipped = 0
    for row in iter_selected_rows(args.input, SOURCE_COLUMNS):
        try:
            records.append(normalize_record(row))
        except (KeyError, ValueError):
            skipped += 1

    artifact = build_lookup_artifact(records)
    validate_lookup_artifact(artifact)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    metadata = {
        "source_file": Path(args.input).name,
        "record_count": artifact["summary"]["record_count"],
        "skipped_rows": skipped,
        "lookup_rows": artifact["summary"]["row_count"],
        "thresholds": artifact["thresholds"],
        "runtime_mode": "static_lookup_only",
    }

    (output_dir / "survival_lookup.json").write_text(json.dumps(artifact, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (output_dir / "options.json").write_text(json.dumps(build_options(artifact), ensure_ascii=False, indent=2), encoding="utf-8")
    (output_dir / "metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(metadata, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Ensure package import path works**

Run:

```bash
PYTHONPATH=scripts python3 scripts/build_lookup.py --help
```

Expected: help text prints and exit code is 0.

- [ ] **Step 3: Add data directory marker**

Create `public/data/.gitkeep`:

```text
```

- [ ] **Step 4: Build artifacts from local workbook**

Run:

```bash
PYTHONPATH=scripts python3 scripts/build_lookup.py --input 统计表.xlsx --output public/data
```

Expected: command prints JSON metadata with `runtime_mode` equal to `static_lookup_only`, creates `public/data/survival_lookup.json`, `public/data/options.json`, and `public/data/metadata.json`.

- [ ] **Step 5: Inspect generated metadata**

Run:

```bash
python3 -m json.tool public/data/metadata.json
```

Expected: `record_count` is close to 40866. If `skipped_rows` is greater than 0, inspect skipped causes before committing generated data.

- [ ] **Step 6: Update README with data build commands**

Modify `README.md`:

```markdown
# seer-survival

Research-display website for SEER oral/pharyngeal cancer overall survival lookup.

## Runtime model

The website uses static lookup only. Kaplan-Meier survival summaries are generated offline from `统计表.xlsx` and written to JSON files under `public/data/`. The browser loads those JSON files and performs deterministic fallback lookup. No backend model inference, Cox model, machine-learning model, or AI reasoning runs at website runtime.

## Local data build

Place the source workbook at the repository root as `统计表.xlsx`, then run:

```bash
PYTHONPATH=scripts python3 scripts/build_lookup.py --input 统计表.xlsx --output public/data
```

The raw workbook is ignored by git.

## App commands

```bash
npm install
npm run test:py
npm run test
npm run build
npm run dev
```

## Research-use limitation

This tool is for research display and method demonstration only. It is not for clinical diagnosis, treatment selection, or individual prognosis decisions.
```

- [ ] **Step 7: Run Python tests and commit CLI**

Run:

```bash
python3 -m unittest discover -s tests/python -p 'test_*.py' -v
git add scripts/build_lookup.py public/data/.gitkeep README.md
git commit -m "feat: add offline lookup build CLI"
```

- [ ] **Step 8: Commit generated JSON after review**

Run:

```bash
git add public/data/options.json public/data/survival_lookup.json public/data/metadata.json
git commit -m "data: add generated survival lookup artifacts"
```

---

## Task 7: Frontend Types, Age Mapping, And Lookup Logic

**Files:**
- Create: `src/data/types.ts`
- Create: `src/data/age.ts`
- Create: `src/data/format.ts`
- Create: `src/data/lookup.ts`
- Create: `src/data/age.test.ts`
- Create: `src/data/lookup.test.ts`

- [ ] **Step 1: Write frontend logic tests**

Create `src/data/age.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ageGroup, coarseAgeGroup } from "./age";

describe("age grouping", () => {
  it("maps continuous ages into lookup groups", () => {
    expect(ageGroup(39)).toBe("<40");
    expect(ageGroup(40)).toBe("40-49");
    expect(ageGroup(59)).toBe("50-59");
    expect(ageGroup(60)).toBe("60-69");
    expect(ageGroup(79)).toBe("70-79");
    expect(ageGroup(80)).toBe("80+");
  });

  it("maps continuous ages into coarse fallback groups", () => {
    expect(coarseAgeGroup(59)).toBe("<60");
    expect(coarseAgeGroup(60)).toBe("60-69");
    expect(coarseAgeGroup(70)).toBe("70+");
  });
});
```

Create `src/data/lookup.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { findLookupResult } from "./lookup";
import type { LookupArtifact, UserSelection } from "./types";

const baseRow = {
  key: "",
  matching_level: "full",
  sex: "Male",
  site: "Tongue",
  histology_group: "8050-8089: squamous cell neoplasms",
  age_group: "60-69",
  t_stage: "T2",
  n_stage: "N1",
  m_stage: "M0",
  sample_size: 50,
  event_count: 30,
  censor_count: 20,
  median_survival_months: 42,
  survival_12m: 0.82,
  survival_36m: 0.57,
  survival_60m: 0.41,
  curve_months: [0, 12, 36, 60],
  curve_survival_probs: [1, 0.82, 0.57, 0.41],
  data_quality_flag: "stable",
} as const;

function artifact(rows: Array<typeof baseRow>): LookupArtifact {
  return {
    version: 1,
    generated_at: "2026-05-19T00:00:00Z",
    thresholds: { minimum_sample: 20, stable_sample: 50 },
    rows,
    index: Object.fromEntries(rows.map((row, index) => [row.key, index])),
    summary: { record_count: 100, row_count: rows.length, sites: ["Tongue"], sexes: ["Male"], histology_groups: ["8050-8089: squamous cell neoplasms"] },
  };
}

const selection: UserSelection = {
  sex: "Male",
  site: "Tongue",
  histologyGroup: "8050-8089: squamous cell neoplasms",
  age: 63,
  tStage: "T2",
  nStage: "N1",
  mStage: "M0",
};

describe("lookup fallback", () => {
  it("uses full match when sample size is enough", () => {
    const row = { ...baseRow, key: "full|Male|Tongue|8050-8089: squamous cell neoplasms|60-69|T2|N1|M0" };
    const result = findLookupResult(selection, artifact([row]));
    expect(result.kind).toBe("matched");
    expect(result.row?.matching_level).toBe("full");
  });

  it("skips a very small full match and falls back", () => {
    const small = { ...baseRow, key: "full|Male|Tongue|8050-8089: squamous cell neoplasms|60-69|T2|N1|M0", sample_size: 12, data_quality_flag: "very_small_sample" };
    const fallback = { ...baseRow, key: "site_tnm|Any|Tongue|Any|Any|T2|N1|M0", matching_level: "site_tnm", sample_size: 80 };
    const result = findLookupResult(selection, artifact([small, fallback]));
    expect(result.kind).toBe("matched");
    expect(result.row?.matching_level).toBe("site_tnm");
    expect(result.skippedSmallSample).toBe(true);
  });
});
```

- [ ] **Step 2: Run frontend tests and verify failure**

Run:

```bash
npm install
npm run test
```

Expected: FAIL because `src/data/age.ts` and `src/data/lookup.ts` do not exist.

- [ ] **Step 3: Implement TypeScript data types**

Create `src/data/types.ts`:

```ts
export type MatchingLevel = "full" | "no_sex" | "no_histology" | "coarse_age" | "site_tnm" | "site_m" | "site_only";
export type DataQualityFlag = "stable" | "small_sample" | "very_small_sample";

export interface LookupRow {
  key: string;
  matching_level: MatchingLevel;
  sex: string;
  site: string;
  histology_group: string;
  age_group: string;
  t_stage: string;
  n_stage: string;
  m_stage: string;
  sample_size: number;
  event_count: number;
  censor_count: number;
  median_survival_months: number | null;
  survival_12m: number;
  survival_36m: number;
  survival_60m: number;
  curve_months: number[];
  curve_survival_probs: number[];
  data_quality_flag: DataQualityFlag;
}

export interface LookupArtifact {
  version: number;
  generated_at: string;
  thresholds: { minimum_sample: number; stable_sample: number };
  rows: LookupRow[];
  index: Record<string, number>;
  summary: {
    record_count: number;
    row_count: number;
    sites: string[];
    sexes: string[];
    histology_groups: string[];
  };
}

export interface OptionsArtifact {
  sexes: string[];
  sites: string[];
  histology_groups: string[];
  age_groups: string[];
  t_stages: string[];
  n_stages: string[];
  m_stages: string[];
}

export interface UserSelection {
  sex: string;
  site: string;
  histologyGroup: string;
  age: number;
  tStage: string;
  nStage: string;
  mStage: string;
}
```

- [ ] **Step 4: Implement age and formatting helpers**

Create `src/data/age.ts`:

```ts
export function ageGroup(age: number): string {
  if (age < 40) return "<40";
  if (age < 50) return "40-49";
  if (age < 60) return "50-59";
  if (age < 70) return "60-69";
  if (age < 80) return "70-79";
  return "80+";
}

export function coarseAgeGroup(age: number): string {
  if (age < 60) return "<60";
  if (age < 70) return "60-69";
  return "70+";
}
```

Create `src/data/format.ts`:

```ts
export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatMedianSurvival(months: number | null): string {
  return months === null ? "中位生存期未达到" : `${months} 个月`;
}
```

- [ ] **Step 5: Implement lookup-only fallback logic**

Create `src/data/lookup.ts`:

```ts
import { ageGroup, coarseAgeGroup } from "./age";
import type { LookupArtifact, LookupRow, MatchingLevel, UserSelection } from "./types";

const ANY = "Any";
const UNKNOWN = "Unknown";

interface Candidate {
  level: MatchingLevel;
  key: string;
}

export interface LookupResult {
  kind: "matched" | "unavailable";
  row: LookupRow | null;
  attemptedKeys: string[];
  skippedSmallSample: boolean;
}

function key(parts: [MatchingLevel, string, string, string, string, string, string, string]): string {
  return parts.join("|");
}

export function candidateKeys(selection: UserSelection): Candidate[] {
  const fineAge = ageGroup(selection.age);
  const fallbackAge = coarseAgeGroup(selection.age);
  return [
    { level: "full", key: key(["full", selection.sex, selection.site, selection.histologyGroup, fineAge, selection.tStage, selection.nStage, selection.mStage]) },
    { level: "no_sex", key: key(["no_sex", ANY, selection.site, selection.histologyGroup, fineAge, selection.tStage, selection.nStage, selection.mStage]) },
    { level: "no_histology", key: key(["no_histology", ANY, selection.site, ANY, fineAge, selection.tStage, selection.nStage, selection.mStage]) },
    { level: "coarse_age", key: key(["coarse_age", ANY, selection.site, ANY, fallbackAge, selection.tStage, selection.nStage, selection.mStage]) },
    { level: "site_tnm", key: key(["site_tnm", ANY, selection.site, ANY, ANY, selection.tStage, selection.nStage, selection.mStage]) },
    { level: "site_m", key: key(["site_m", ANY, selection.site, ANY, ANY, UNKNOWN, UNKNOWN, selection.mStage]) },
    { level: "site_only", key: key(["site_only", ANY, selection.site, ANY, ANY, UNKNOWN, UNKNOWN, UNKNOWN]) },
  ];
}

export function findLookupResult(selection: UserSelection, artifact: LookupArtifact): LookupResult {
  const attemptedKeys: string[] = [];
  let skippedSmallSample = false;
  for (const candidate of candidateKeys(selection)) {
    attemptedKeys.push(candidate.key);
    const index = artifact.index[candidate.key];
    if (index === undefined) continue;
    const row = artifact.rows[index];
    if (row.sample_size < artifact.thresholds.minimum_sample) {
      skippedSmallSample = true;
      continue;
    }
    return { kind: "matched", row, attemptedKeys, skippedSmallSample };
  }
  return { kind: "unavailable", row: null, attemptedKeys, skippedSmallSample };
}
```

- [ ] **Step 6: Run frontend logic tests**

Run:

```bash
npm run test
```

Expected: all frontend tests PASS.

- [ ] **Step 7: Commit frontend logic**

Run:

```bash
git add src/data/types.ts src/data/age.ts src/data/format.ts src/data/lookup.ts src/data/age.test.ts src/data/lookup.test.ts
git commit -m "feat: add browser lookup logic"
```

---

## Task 8: Static Research UI

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/components/InputPanel.tsx`
- Create: `src/components/ResultSummary.tsx`
- Create: `src/components/SurvivalCurve.tsx`
- Create: `src/components/MethodPanel.tsx`
- Create: `src/styles.css`

- [ ] **Step 1: Create app entry point**

Create `src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 2: Create input panel**

Create `src/components/InputPanel.tsx`:

```tsx
import type { OptionsArtifact, UserSelection } from "../data/types";

interface Props {
  options: OptionsArtifact;
  value: UserSelection;
  onChange: (next: UserSelection) => void;
}

function SelectField({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {values.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}

export function InputPanel({ options, value, onChange }: Props) {
  return (
    <section className="panel input-panel" aria-label="输入条件">
      <SelectField label="性别" value={value.sex} values={options.sexes} onChange={(sex) => onChange({ ...value, sex })} />
      <label className="field">
        <span>年龄</span>
        <input
          type="number"
          min={0}
          max={110}
          value={value.age}
          onChange={(event) => onChange({ ...value, age: Number(event.target.value) })}
        />
      </label>
      <SelectField label="肿瘤部位" value={value.site} values={options.sites} onChange={(site) => onChange({ ...value, site })} />
      <SelectField label="组织学大类" value={value.histologyGroup} values={options.histology_groups} onChange={(histologyGroup) => onChange({ ...value, histologyGroup })} />
      <SelectField label="T 分期" value={value.tStage} values={options.t_stages} onChange={(tStage) => onChange({ ...value, tStage })} />
      <SelectField label="N 分期" value={value.nStage} values={options.n_stages} onChange={(nStage) => onChange({ ...value, nStage })} />
      <SelectField label="M 分期" value={value.mStage} values={options.m_stages} onChange={(mStage) => onChange({ ...value, mStage })} />
    </section>
  );
}
```

- [ ] **Step 3: Create result summary**

Create `src/components/ResultSummary.tsx`:

```tsx
import { formatMedianSurvival, formatPercent } from "../data/format";
import type { LookupResult } from "../data/lookup";

const LEVEL_LABELS: Record<string, string> = {
  full: "完整匹配",
  no_sex: "去除性别后匹配",
  no_histology: "去除组织学大类后匹配",
  coarse_age: "粗年龄组匹配",
  site_tnm: "肿瘤部位 + T/N/M 匹配",
  site_m: "肿瘤部位 + M 分期匹配",
  site_only: "肿瘤部位总体匹配",
};

export function ResultSummary({ result }: { result: LookupResult }) {
  if (result.kind === "unavailable" || !result.row) {
    return (
      <section className="panel result-panel">
        <h2>没有可展示结果</h2>
        <p>当前组合和回退层级均未达到最小样本量阈值。</p>
      </section>
    );
  }

  const row = result.row;
  return (
    <section className="panel result-panel">
      <div className="result-header">
        <div>
          <h2>总体生存查表结果</h2>
          <p>{LEVEL_LABELS[row.matching_level]}，样本量 {row.sample_size}，事件 {row.event_count}，删失 {row.censor_count}</p>
        </div>
        <span className={`quality ${row.data_quality_flag}`}>{row.data_quality_flag === "stable" ? "样本量稳定" : "样本量较小"}</span>
      </div>
      {result.skippedSmallSample && <p className="notice">完整组合样本量不足，已按预设规则回退到更粗匹配条件。</p>}
      <div className="kpi-grid">
        <div><span>中位总体生存期</span><strong>{formatMedianSurvival(row.median_survival_months)}</strong></div>
        <div><span>1 年总体生存率</span><strong>{formatPercent(row.survival_12m)}</strong></div>
        <div><span>3 年总体生存率</span><strong>{formatPercent(row.survival_36m)}</strong></div>
        <div><span>5 年总体生存率</span><strong>{formatPercent(row.survival_60m)}</strong></div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create SVG survival curve**

Create `src/components/SurvivalCurve.tsx`:

```tsx
import type { LookupRow } from "../data/types";

export function SurvivalCurve({ row }: { row: LookupRow | null }) {
  if (!row) {
    return <section className="panel chart-panel"><h2>Kaplan-Meier 曲线</h2><p>没有可绘制结果。</p></section>;
  }

  const width = 720;
  const height = 320;
  const padding = 42;
  const maxMonth = Math.max(60, ...row.curve_months);
  const points = row.curve_months.map((month, index) => {
    const x = padding + (month / maxMonth) * (width - padding * 2);
    const y = padding + (1 - row.curve_survival_probs[index]) * (height - padding * 2);
    return `${x},${y}`;
  });

  return (
    <section className="panel chart-panel">
      <h2>Kaplan-Meier 生存曲线</h2>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Kaplan-Meier survival curve">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="axis" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="axis" />
        <polyline points={points.join(" ")} className="curve" fill="none" />
        <text x={width / 2} y={height - 8} textAnchor="middle">随访月数</text>
        <text x={16} y={height / 2} textAnchor="middle" transform={`rotate(-90 16 ${height / 2})`}>总体生存率</text>
      </svg>
    </section>
  );
}
```

- [ ] **Step 5: Create method panel**

Create `src/components/MethodPanel.tsx`:

```tsx
export function MethodPanel() {
  return (
    <section className="panel method-panel">
      <h2>方法与边界</h2>
      <p>本网站仅使用离线预计算的 Kaplan-Meier 查找表。浏览器根据输入条件按固定回退顺序查找相似病例组，不运行后台模型推理。</p>
      <p>结局为总体生存，死亡记为事件，存活记为右删失。结果仅用于科研展示和方法演示，不用于临床诊断、治疗选择或个体预后判断。</p>
    </section>
  );
}
```

- [ ] **Step 6: Compose app**

Create `src/App.tsx`:

```tsx
import { useEffect, useMemo, useState } from "react";
import { InputPanel } from "./components/InputPanel";
import { MethodPanel } from "./components/MethodPanel";
import { ResultSummary } from "./components/ResultSummary";
import { SurvivalCurve } from "./components/SurvivalCurve";
import { findLookupResult } from "./data/lookup";
import type { LookupArtifact, OptionsArtifact, UserSelection } from "./data/types";

const defaultOptions: OptionsArtifact = {
  sexes: ["Male", "Female"],
  sites: ["Tongue"],
  histology_groups: ["8050-8089: squamous cell neoplasms"],
  age_groups: ["<40", "40-49", "50-59", "60-69", "70-79", "80+"],
  t_stages: ["T0", "T1", "T2", "T3", "T4", "TX", "Unknown"],
  n_stages: ["N0", "N1", "N2", "N3", "NX", "Unknown"],
  m_stages: ["M0", "M1", "MX", "Unknown"],
};

export default function App() {
  const [options, setOptions] = useState<OptionsArtifact>(defaultOptions);
  const [artifact, setArtifact] = useState<LookupArtifact | null>(null);
  const [selection, setSelection] = useState<UserSelection>({
    sex: "Male",
    site: "Tongue",
    histologyGroup: "8050-8089: squamous cell neoplasms",
    age: 63,
    tStage: "T2",
    nStage: "N1",
    mStage: "M0",
  });

  useEffect(() => {
    Promise.all([
      fetch("/data/options.json").then((response) => response.json()),
      fetch("/data/survival_lookup.json").then((response) => response.json()),
    ]).then(([loadedOptions, loadedArtifact]) => {
      setOptions(loadedOptions);
      setArtifact(loadedArtifact);
      setSelection((current) => ({
        ...current,
        sex: loadedOptions.sexes[0] ?? current.sex,
        site: loadedOptions.sites[0] ?? current.site,
        histologyGroup: loadedOptions.histology_groups[0] ?? current.histologyGroup,
      }));
    });
  }, []);

  const result = useMemo(() => (artifact ? findLookupResult(selection, artifact) : { kind: "unavailable", row: null, attemptedKeys: [], skippedSmallSample: false } as const), [artifact, selection]);

  return (
    <main>
      <header className="app-header">
        <p className="eyebrow">SEER static lookup</p>
        <h1>口腔/咽部癌症总体生存查表工具</h1>
        <p>输入病例特征后，网站按预计算 Kaplan-Meier 查找表展示相似历史病例组的总体生存分布。</p>
      </header>
      <div className="layout">
        <InputPanel options={options} value={selection} onChange={setSelection} />
        <div className="results-stack">
          <ResultSummary result={result} />
          <SurvivalCurve row={result.row} />
          <MethodPanel />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 7: Add CSS**

Create `src/styles.css`:

```css
:root {
  color: #182024;
  background: #f5f7f4;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

main {
  min-height: 100vh;
}

.app-header {
  padding: 40px clamp(20px, 4vw, 56px) 24px;
  background: #0f2f2d;
  color: #f8fbf7;
}

.eyebrow {
  margin: 0 0 8px;
  color: #abd7c5;
  font-size: 13px;
  text-transform: uppercase;
}

h1, h2, p {
  margin-top: 0;
}

h1 {
  max-width: 920px;
  margin-bottom: 10px;
  font-size: clamp(30px, 4vw, 52px);
  letter-spacing: 0;
}

.app-header p:last-child {
  max-width: 820px;
  margin-bottom: 0;
  color: #dbe9e2;
}

.layout {
  display: grid;
  grid-template-columns: minmax(280px, 360px) 1fr;
  gap: 20px;
  padding: 24px clamp(16px, 4vw, 56px) 48px;
}

.panel {
  border: 1px solid #d9e1dc;
  border-radius: 8px;
  background: #ffffff;
  padding: 18px;
}

.input-panel {
  align-self: start;
  display: grid;
  gap: 14px;
}

.field {
  display: grid;
  gap: 6px;
  font-size: 14px;
  color: #47514d;
}

select, input {
  width: 100%;
  min-height: 40px;
  border: 1px solid #cbd5cf;
  border-radius: 6px;
  padding: 8px 10px;
  color: #182024;
  background: #ffffff;
  font: inherit;
}

.results-stack {
  display: grid;
  gap: 20px;
}

.result-header {
  display: flex;
  gap: 16px;
  justify-content: space-between;
  align-items: flex-start;
}

.quality {
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 13px;
  background: #e8f4ef;
  color: #17634d;
  white-space: nowrap;
}

.quality.small_sample {
  background: #fff5db;
  color: #7b5600;
}

.notice {
  padding: 10px 12px;
  border-left: 3px solid #c58a00;
  background: #fff9e8;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(120px, 1fr));
  gap: 12px;
}

.kpi-grid div {
  border: 1px solid #e0e6e2;
  border-radius: 6px;
  padding: 12px;
}

.kpi-grid span {
  display: block;
  margin-bottom: 8px;
  color: #5d6863;
  font-size: 13px;
}

.kpi-grid strong {
  font-size: 22px;
}

svg {
  width: 100%;
  height: auto;
}

.axis {
  stroke: #7a8580;
  stroke-width: 1.5;
}

.curve {
  stroke: #246b5a;
  stroke-width: 3;
}

@media (max-width: 860px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .kpi-grid {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }
}
```

- [ ] **Step 8: Run frontend build**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build complete successfully.

- [ ] **Step 9: Commit static UI**

Run:

```bash
git add src index.html package.json package-lock.json tsconfig.json vite.config.ts
git commit -m "feat: add static survival lookup UI"
```

---

## Task 9: End-To-End Verification And Documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-05-19-seer-survival-lookup-design.md` only if implementation decisions differ from the approved spec

- [ ] **Step 1: Run all tests**

Run:

```bash
python3 -m unittest discover -s tests/python -p 'test_*.py' -v
npm run test
npm run build
```

Expected: Python tests PASS, Vitest tests PASS, Vite build succeeds.

- [ ] **Step 2: Rebuild data artifacts from source workbook**

Run:

```bash
PYTHONPATH=scripts python3 scripts/build_lookup.py --input 统计表.xlsx --output public/data
```

Expected: metadata prints with `runtime_mode` equal to `static_lookup_only`, `record_count` near 40866, and no validation exception.

- [ ] **Step 3: Check runtime artifact mode**

Run:

```bash
python3 -m json.tool public/data/metadata.json
```

Expected: metadata includes:

```json
{
  "runtime_mode": "static_lookup_only"
}
```

- [ ] **Step 4: Start local app**

Run:

```bash
npm run dev
```

Expected: Vite prints a local URL such as `http://127.0.0.1:5173/`.

- [ ] **Step 5: Browser smoke test**

Open the local URL. Verify:

- Input fields render for sex, age, site, histology group, T, N, and M.
- Changing age changes the lookup result without network calls beyond static JSON fetches.
- Result panel shows matching level, sample size, event count, censor count, median survival, 1/3/5 year survival rates.
- Survival curve is visible and nonblank.
- Method panel states research-only use and static lookup only.

- [ ] **Step 6: Update README with final commands**

Ensure `README.md` includes:

```markdown
## Verification

```bash
python3 -m unittest discover -s tests/python -p 'test_*.py' -v
npm run test
npm run build
```

## Local preview

```bash
npm run dev
```
```

- [ ] **Step 7: Commit verification documentation**

Run:

```bash
git add README.md public/data/options.json public/data/survival_lookup.json public/data/metadata.json
git commit -m "docs: add verification and runtime notes"
```

- [ ] **Step 8: Push branch**

Run:

```bash
git push
```

Expected: `main` pushes to `origin/main`.

---

## Self-Review Checklist

- Spec coverage: data source, overall survival definition, input variables, TNM harmonization, KM lookup generation, sample thresholds, fallback order, output fields, static runtime, validation checks, and research-only limits are each represented in tasks above.
- Runtime constraint: frontend tasks load `public/data/*.json` and use `findLookupResult`; no task adds a backend inference service or model runtime.
- Testing: normalization, KM math, XLSX column extraction, lookup artifact integrity, browser age mapping, and lookup fallback each have tests before implementation steps.
- Artifact traceability: generated rows include sample size, event count, censor count, matching level, key, curve arrays, and quality flag.
- Deployment shape: static Vite app can run locally and be deployed as static files.
