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
    median = None

    for month in months:
        events = event_counts[month]
        censored = censor_counts[month]
        if events:
            survival *= 1.0 - (events / at_risk)
            rounded_survival = round(survival, 6)
            curve_months.append(month)
            curve_survival_probs.append(rounded_survival)
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
