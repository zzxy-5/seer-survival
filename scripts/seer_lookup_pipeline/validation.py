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
        if row["median_followup_months"] < 0:
            raise ValueError(f"Median follow-up must be non-negative for {row['key']}")
        if not 0 <= row["risk_60m"] <= row["sample_size"]:
            raise ValueError(f"60-month risk set must be within sample size for {row['key']}")
        for field in ["survival_12m", "survival_36m", "survival_60m"]:
            _assert_probability(row[field], field)
        probs = row["curve_survival_probs"]
        months = row["curve_months"]
        if len(probs) != len(months):
            raise ValueError(f"Curve length mismatch for {row['key']}")
        for probability in probs:
            _assert_probability(probability, "curve_survival_probs")
        if months[0] != 0 or probs[0] != 1.0:
            raise ValueError(f"Curve must start at month 0 with survival 1.0 for {row['key']}")
        for previous, current in zip(probs, probs[1:]):
            if current > previous:
                raise ValueError(f"KM curve must be monotonic non-increasing for {row['key']}")
        for previous, current in zip(months, months[1:]):
            if current < previous:
                raise ValueError(f"Curve months must be sorted for {row['key']}")
