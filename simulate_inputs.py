from __future__ import annotations

from backend.agent_pipeline import run_pipeline_by_id


SCENARIO_IDS = [f"scenario_{index}" for index in range(1, 6)]


def _divider() -> str:
    return "=" * 78


def _confidence_formula_text(confidence) -> str:
    return (
        f"{confidence.base_confidence} base + "
        f"{confidence.correlated_signal_addition} signal addition + "
        f"{confidence.weather_alert_addition} weather alert - "
        f"{confidence.stale_signal_penalty} stale penalty - "
        f"{confidence.single_source_penalty} single-source penalty = "
        f"{confidence.final_score}"
    )


def _print_agent_3_evidence(reasoning_chain: list[str]) -> None:
    print("Agent 3 Situation Analyst evidence:")
    for index, step in enumerate(reasoning_chain, start=1):
        print(f"  {index}. {step}")


def _validate_result(scenario_id: str, result) -> list[str]:
    failures: list[str] = []
    analysis = result.situation_analyst.analysis

    if scenario_id == "scenario_1":
        required_terms = [
            "Signal count is 4",
            "rainfall is 8.4mm per hour",
            "Khayaban-e-Iqbal speed 0.0km/h",
            "Confidence formula:",
            "Severity logic:",
            "Primary risks:",
            "Secondary risks:",
        ]
        joined_reasoning = "\n".join(analysis.reasoning_chain)
        for term in required_terms:
            if term not in joined_reasoning:
                failures.append(f"scenario_1 missing Agent 3 evidence term: {term}")
        if analysis.escalation.value != "crisis":
            failures.append("scenario_1 should escalate to crisis.")

    if scenario_id == "scenario_2":
        if analysis.escalation.value != "crisis":
            failures.append("scenario_2 should escalate to crisis.")
        if analysis.crisis_type.value != "accident":
            failures.append(f"scenario_2 crisis_type should be 'accident', got '{analysis.crisis_type.value}'.")
        if "Faizabad" not in analysis.location:
            failures.append(f"scenario_2 location should contain 'Faizabad', got '{analysis.location}'.")

    if scenario_id == "scenario_3":
        if analysis.escalation.value != "crisis":
            failures.append("scenario_3 should escalate to crisis.")
        if analysis.crisis_type.value != "flash_flood":
            failures.append(f"scenario_3 crisis_type should be 'flash_flood', got '{analysis.crisis_type.value}'.")
        if analysis.severity_score < 4:
            failures.append(f"scenario_3 severity should be >= 4, got {analysis.severity_score}.")

    if scenario_id == "scenario_4":
        if analysis.escalation.value != "crisis":
            failures.append("scenario_4 should escalate to crisis.")
        if "G-11" not in analysis.location:
            failures.append(f"scenario_4 location should contain 'G-11', got '{analysis.location}'.")
        if analysis.confidence.correlated_signal_count < 3:
            failures.append(
                f"scenario_4 should have >= 3 correlated signals, got {analysis.confidence.correlated_signal_count}."
            )

    if scenario_id == "scenario_5":
        if analysis.confidence.final_score > 0.3:
            failures.append("scenario_5 confidence must remain 0.3 or below.")
        if analysis.escalation.value != "no_escalation":
            failures.append("scenario_5 must not escalate.")
        if result.response_planner.plan.actions:
            failures.append("scenario_5 must not generate response actions.")

    return failures


def main() -> int:
    failures: list[str] = []

    print(_divider())
    print("CIRO simulated input run - all five demo scenarios")
    print(_divider())

    for scenario_id in SCENARIO_IDS:
        result = run_pipeline_by_id(scenario_id)
        scenario = result.scenario
        analysis = result.situation_analyst.analysis
        confidence = analysis.confidence
        action_count = len(result.response_planner.plan.actions)

        print()
        print(_divider())
        print(f"{scenario.scenario_id}: {scenario.title}")
        print(_divider())
        print(f"Detected situation: {analysis.detected_situation}")
        print(f"Crisis type: {analysis.crisis_type.value}")
        print(f"Location: {analysis.location}")
        print(f"Confidence score: {confidence.final_score} ({analysis.confidence_band.value})")
        print(f"Confidence formula: {_confidence_formula_text(confidence)}")
        print(f"Severity: {analysis.severity_score}/5")
        print(f"Escalation: {analysis.escalation.value}")
        print(f"Response actions: {action_count}")
        print(f"Simulation status: {result.execution_simulator.execution.system_status}")
        if analysis.escalation.value == "no_escalation":
            print("Mode: passive monitoring only; no emergency action plan generated.")
        else:
            print("Mode: crisis response simulation active.")
        print()
        _print_agent_3_evidence(analysis.reasoning_chain)

        failures.extend(_validate_result(scenario_id, result))

    print()
    print(_divider())
    if failures:
        print("Verification failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("Verification passed: all five scenarios completed with expected escalation behavior.")
    print(_divider())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
