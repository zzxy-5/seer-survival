from __future__ import annotations

import re
from collections.abc import Mapping

from .schema import ANY_VALUE, SOURCE_COLUMNS, UNKNOWN_VALUE, LookupKey, NormalizedRecord

UNKNOWN_INPUTS = {"", "Blank(s)", "N/A", "Not applicable", "Unknown", "88", "99"}


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


def _parse_age(age: str) -> int:
    return int(float(str(age).strip()))


def age_group(age: str) -> str:
    value = _parse_age(age)
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
    value = _parse_age(age)
    if value < 60:
        return "<60"
    if value < 70:
        return "60-69"
    return "70+"


def _normalize_stage(raw: str, prefix: str, allowed: set[str]) -> str:
    text = str(raw).strip()
    if text in UNKNOWN_INPUTS:
        return UNKNOWN_VALUE
    normalized = text.upper().replace(" ", "")
    normalized = re.sub(r"^[CPY]+", "", normalized)
    match = re.fullmatch(rf"({prefix}[0-4X])([A-D])?", normalized)
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


def _categorical(value: str) -> str:
    text = str(value).strip()
    return text if text else UNKNOWN_VALUE


def normalize_record(row: Mapping[str, str]) -> NormalizedRecord:
    t_raw, n_raw, m_raw = choose_tnm_source(row)
    age = row[SOURCE_COLUMNS["age"]]
    return NormalizedRecord(
        sex=_categorical(row[SOURCE_COLUMNS["sex"]]),
        site=_categorical(row[SOURCE_COLUMNS["site"]]),
        histology_group=_categorical(row[SOURCE_COLUMNS["histology_group"]]),
        age_group=age_group(age),
        coarse_age_group=coarse_age_group(age),
        t_stage=normalize_t_stage(t_raw),
        n_stage=normalize_n_stage(n_raw),
        m_stage=normalize_m_stage(m_raw),
        survival_months=parse_survival_months(row[SOURCE_COLUMNS["survival_months"]]),
        event=parse_event(row[SOURCE_COLUMNS["vital_status"]]),
    )


def key_to_string(key: LookupKey) -> str:
    return "|".join(
        [
            key.matching_level,
            key.sex,
            key.site,
            key.histology_group,
            key.age_group,
            key.t_stage,
            key.n_stage,
            key.m_stage,
        ],
    )


def matching_keys(record: NormalizedRecord) -> list[LookupKey]:
    return [
        LookupKey(
            "full",
            record.sex,
            record.site,
            record.histology_group,
            record.age_group,
            record.t_stage,
            record.n_stage,
            record.m_stage,
        ),
        LookupKey(
            "no_sex",
            ANY_VALUE,
            record.site,
            record.histology_group,
            record.age_group,
            record.t_stage,
            record.n_stage,
            record.m_stage,
        ),
        LookupKey(
            "no_histology",
            ANY_VALUE,
            record.site,
            ANY_VALUE,
            record.age_group,
            record.t_stage,
            record.n_stage,
            record.m_stage,
        ),
        LookupKey(
            "coarse_age",
            ANY_VALUE,
            record.site,
            ANY_VALUE,
            record.coarse_age_group,
            record.t_stage,
            record.n_stage,
            record.m_stage,
        ),
        LookupKey(
            "site_tnm",
            ANY_VALUE,
            record.site,
            ANY_VALUE,
            ANY_VALUE,
            record.t_stage,
            record.n_stage,
            record.m_stage,
        ),
        LookupKey(
            "site_m",
            ANY_VALUE,
            record.site,
            ANY_VALUE,
            ANY_VALUE,
            ANY_VALUE,
            ANY_VALUE,
            record.m_stage,
        ),
        LookupKey(
            "site_only",
            ANY_VALUE,
            record.site,
            ANY_VALUE,
            ANY_VALUE,
            ANY_VALUE,
            ANY_VALUE,
            ANY_VALUE,
        ),
    ]
