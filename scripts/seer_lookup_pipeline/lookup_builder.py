from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
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
        "generated_at": datetime.now(timezone.utc).isoformat(),
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
