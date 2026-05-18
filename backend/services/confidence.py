from __future__ import annotations

from datetime import datetime, timezone
from typing import Iterable, List

from backend.schemas import ConfidenceBand, ConfidenceBreakdown, CrisisType, EscalationLevel, SignalEvent


CONFIDENCE_FORMULA_TEXT = (
    "Base confidence starts at 0.5. Add 0.1 for each correlated independent signal "
    "up to a maximum addition of 0.4. Add 0.1 if an active weather alert from PMD API "
    "is confirmed. Subtract 0.1 if all signals are older than 20 minutes. Subtract 0.1 "
    "if only one source type is represented. The minimum possible score is 0.2. "
    "The maximum possible score is 1.0."
)


def _round_score(value: float) -> float:
    return round(value + 1e-9, 2)


def calculate_confidence(
    signals: Iterable[SignalEvent],
    weather_alert_active: bool,
    reference_time: datetime | None = None,
) -> ConfidenceBreakdown:
    signal_list: List[SignalEvent] = list(signals)
    now = reference_time or datetime.now(timezone.utc)

    correlated_signal_count = len(
        [signal for signal in signal_list if signal.crisis_type != CrisisType.NO_CRISIS]
    )
    source_type_count = len({signal.source_type for signal in signal_list})
    base_confidence = 0.5
    correlated_signal_addition = min(0.1 * correlated_signal_count, 0.4)
    weather_alert_addition = 0.1 if weather_alert_active else 0.0

    all_stale = bool(signal_list) and all(
        (now - signal.timestamp).total_seconds() > 20 * 60 for signal in signal_list
    )
    stale_signal_penalty = 0.1 if all_stale else 0.0
    single_source_penalty = 0.1 if source_type_count <= 1 else 0.0

    raw_score = (
        base_confidence
        + correlated_signal_addition
        + weather_alert_addition
        - stale_signal_penalty
        - single_source_penalty
    )
    final_score = max(0.2, min(1.0, raw_score))

    return ConfidenceBreakdown(
        formula_text=CONFIDENCE_FORMULA_TEXT,
        base_confidence=_round_score(base_confidence),
        correlated_signal_count=correlated_signal_count,
        source_type_count=source_type_count,
        correlated_signal_addition=_round_score(correlated_signal_addition),
        weather_alert_addition=_round_score(weather_alert_addition),
        stale_signal_penalty=_round_score(stale_signal_penalty),
        single_source_penalty=_round_score(single_source_penalty),
        raw_score_before_bounds=_round_score(raw_score),
        final_score=_round_score(final_score),
    )


def confidence_band(score: float) -> ConfidenceBand:
    if score >= 0.75:
        return ConfidenceBand.HIGH
    if score >= 0.5:
        return ConfidenceBand.MEDIUM
    return ConfidenceBand.LOW


def escalation_level(score: float, source_type_count: int, correlated_signal_count: int) -> EscalationLevel:
    if score >= 0.7 and source_type_count >= 2 and correlated_signal_count >= 2:
        return EscalationLevel.CRISIS
    if score >= 0.5 and correlated_signal_count >= 2:
        return EscalationLevel.WATCHLIST
    return EscalationLevel.NO_ESCALATION
