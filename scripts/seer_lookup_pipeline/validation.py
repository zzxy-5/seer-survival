from __future__ import annotations

from typing import Any


def _assert_probability(value: float, field: str) -> None:
    if not 0.0 <= value <= 1.0:
        raise ValueError(f"{field} must be between 0 and 1: {value}")


def _assert_confidence_interval(value: list[float] | tuple[float, float], estimate: float, field: str) -> None:
    if len(value) != 2:
        raise ValueError(f"{field} must contain lower and upper bounds")
    lower, upper = value
    _assert_probability(lower, field)
    _assert_probability(upper, field)
    if lower > upper:
        raise ValueError(f"{field} lower bound exceeds upper bound")
    if estimate < lower - 1e-6 or estimate > upper + 1e-6:
        raise ValueError(f"{field} must contain the point estimate")


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
        risk_months = row["risk_table_months"]
        risk_counts = row["risk_table_counts"]
        if len(risk_months) != len(risk_counts):
            raise ValueError(f"Risk table length mismatch for {row['key']}")
        if risk_months != sorted(risk_months):
            raise ValueError(f"Risk table months must be sorted for {row['key']}")
        for count in risk_counts:
            if not 0 <= count <= row["sample_size"]:
                raise ValueError(f"Risk table counts must be within sample size for {row['key']}")
        for previous, current in zip(risk_counts, risk_counts[1:]):
            if current > previous:
                raise ValueError(f"Risk table counts must be monotonic non-increasing for {row['key']}")
        for field in ["survival_12m", "survival_36m", "survival_60m"]:
            _assert_probability(row[field], field)
            _assert_confidence_interval(row[f"{field}_ci"], row[field], f"{field}_ci")
        probs = row["curve_survival_probs"]
        months = row["curve_months"]
        if len(probs) != len(months):
            raise ValueError(f"Curve length mismatch for {row['key']}")
        lower_probs = row["curve_ci_lower_probs"]
        upper_probs = row["curve_ci_upper_probs"]
        if len(lower_probs) != len(months) or len(upper_probs) != len(months):
            raise ValueError(f"Curve confidence interval length mismatch for {row['key']}")
        for probability in probs:
            _assert_probability(probability, "curve_survival_probs")
        for probability, lower, upper in zip(probs, lower_probs, upper_probs):
            _assert_confidence_interval((lower, upper), probability, "curve_confidence_interval")
        if months[0] != 0 or probs[0] != 1.0:
            raise ValueError(f"Curve must start at month 0 with survival 1.0 for {row['key']}")
        for previous, current in zip(probs, probs[1:]):
            if current > previous:
                raise ValueError(f"KM curve must be monotonic non-increasing for {row['key']}")
        for previous, current in zip(months, months[1:]):
            if current < previous:
                raise ValueError(f"Curve months must be sorted for {row['key']}")
        censor_months = row.get("censor_months", [])
        if len(censor_months) > row["censor_count"]:
            raise ValueError(f"Censor marker count exceeds censored observations for {row['key']}")
        for month in censor_months:
            if month < 0:
                raise ValueError(f"Censor months must be non-negative for {row['key']}")
        for previous, current in zip(censor_months, censor_months[1:]):
            if current <= previous:
                raise ValueError(f"Censor months must be unique and sorted for {row['key']}")
