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
