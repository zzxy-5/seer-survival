from __future__ import annotations

import math
from collections import Counter
from dataclasses import dataclass
from statistics import median

CONFIDENCE_Z_95 = 1.959963984540054
RISK_TABLE_MONTHS = (0, 12, 24, 36, 48, 60)


@dataclass(frozen=True)
class KMResult:
    sample_size: int
    event_count: int
    censor_count: int
    median_survival_months: int | None
    median_followup_months: float
    risk_60m: int
    risk_table_months: list[int]
    risk_table_counts: list[int]
    survival_12m: float
    survival_12m_ci: tuple[float, float]
    survival_36m: float
    survival_36m_ci: tuple[float, float]
    survival_60m: float
    survival_60m_ci: tuple[float, float]
    curve_months: list[int]
    curve_survival_probs: list[float]
    curve_ci_lower_probs: list[float]
    curve_ci_upper_probs: list[float]
    censor_months: list[int]


def _survival_at(curve_months: list[int], curve_survival_probs: list[float], horizon: int) -> float:
    value = 1.0
    for month, probability in zip(curve_months, curve_survival_probs):
        if month <= horizon:
            value = probability
        else:
            break
    return value


def _ci_at(
    curve_months: list[int],
    curve_ci_lower_probs: list[float],
    curve_ci_upper_probs: list[float],
    horizon: int,
) -> tuple[float, float]:
    lower = 1.0
    upper = 1.0
    for month, next_lower, next_upper in zip(curve_months, curve_ci_lower_probs, curve_ci_upper_probs):
        if month <= horizon:
            lower = next_lower
            upper = next_upper
        else:
            break
    return (lower, upper)


def _round_ci(lower: float, upper: float) -> tuple[float, float]:
    return (round(max(0.0, min(1.0, lower)), 6), round(max(0.0, min(1.0, upper)), 6))


def _log_log_greenwood_ci(survival: float, greenwood_sum: float) -> tuple[float, float]:
    if survival >= 1.0:
        return (1.0, 1.0)
    if survival <= 0.0:
        return (0.0, 0.0)
    if greenwood_sum <= 0.0:
        return _round_ci(survival, survival)

    log_survival = math.log(survival)
    se = math.sqrt(greenwood_sum) / abs(log_survival)
    transformed = math.log(-log_survival)
    lower = math.exp(-math.exp(transformed + CONFIDENCE_Z_95 * se))
    upper = math.exp(-math.exp(transformed - CONFIDENCE_Z_95 * se))
    return _round_ci(lower, upper)


def kaplan_meier(observations: list[tuple[int, bool]]) -> KMResult:
    """Compute a KM curve from (month, event) pairs; event=True means death observed.

    For ties at the same month, events are applied against the risk set before
    censoring is removed, matching standard Kaplan-Meier handling.
    """
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
    curve_ci_lower_probs = [1.0]
    curve_ci_upper_probs = [1.0]
    greenwood_sum = 0.0
    median_survival = None

    for month in months:
        events = event_counts[month]
        censored = censor_counts[month]
        if events:
            survival *= 1.0 - (events / at_risk)
            if at_risk > events:
                greenwood_sum += events / (at_risk * (at_risk - events))
            rounded_survival = round(survival, 6)
            ci_lower, ci_upper = _log_log_greenwood_ci(survival, greenwood_sum)
            curve_months.append(month)
            curve_survival_probs.append(rounded_survival)
            curve_ci_lower_probs.append(ci_lower)
            curve_ci_upper_probs.append(ci_upper)
            if median_survival is None and survival <= 0.5:
                median_survival = month
        at_risk -= events + censored
        if at_risk <= 0:
            break

    return KMResult(
        sample_size=sample_size,
        event_count=sum(event_counts.values()),
        censor_count=sum(censor_counts.values()),
        median_survival_months=median_survival,
        median_followup_months=round(float(median(month for month, _event in observations)), 1),
        risk_60m=sum(1 for month, _event in observations if month >= 60),
        risk_table_months=list(RISK_TABLE_MONTHS),
        risk_table_counts=[sum(1 for month, _event in observations if month >= horizon) for horizon in RISK_TABLE_MONTHS],
        survival_12m=round(_survival_at(curve_months, curve_survival_probs, 12), 6),
        survival_12m_ci=_ci_at(curve_months, curve_ci_lower_probs, curve_ci_upper_probs, 12),
        survival_36m=round(_survival_at(curve_months, curve_survival_probs, 36), 6),
        survival_36m_ci=_ci_at(curve_months, curve_ci_lower_probs, curve_ci_upper_probs, 36),
        survival_60m=round(_survival_at(curve_months, curve_survival_probs, 60), 6),
        survival_60m_ci=_ci_at(curve_months, curve_ci_lower_probs, curve_ci_upper_probs, 60),
        curve_months=curve_months,
        curve_survival_probs=curve_survival_probs,
        curve_ci_lower_probs=curve_ci_lower_probs,
        curve_ci_upper_probs=curve_ci_upper_probs,
        censor_months=sorted(censor_counts),
    )
