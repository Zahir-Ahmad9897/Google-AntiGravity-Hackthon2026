from __future__ import annotations

import sys
from typing import List

from backend.agents.crisis_detector import run_crisis_detector
from backend.agents.execution_simulator import run_execution_simulator
from backend.agents.impact_reporter import run_impact_reporter
from backend.agents.response_planner import run_response_planner
from backend.agents.signal_watcher import run_signal_watcher
from backend.agents.situation_analyst import run_situation_analyst
from backend.schemas import AgentLog, AgentName, PipelineResult, ScenarioInput
from backend.services.scenario_store import get_scenario


def run_pipeline(scenario: ScenarioInput) -> PipelineResult:
    logs: List[AgentLog] = []

    signal_watcher = run_signal_watcher(scenario)
    logs.append(
        AgentLog(
            agent_name=AgentName.SIGNAL_WATCHER,
            message=f"Extracted {len(signal_watcher.signals)} signal(s).",
        )
    )

    crisis_detector = run_crisis_detector(scenario, signal_watcher)
    logs.append(
        AgentLog(
            agent_name=AgentName.CRISIS_DETECTOR,
            message=(
                "Selected cluster "
                f"{crisis_detector.selected_cluster.cluster_id if crisis_detector.selected_cluster else 'none'}."
            ),
        )
    )

    situation_analyst = run_situation_analyst(scenario, crisis_detector)
    logs.append(
        AgentLog(
            agent_name=AgentName.SITUATION_ANALYST,
            message=(
                f"{situation_analyst.analysis.detected_situation}; "
                f"confidence={situation_analyst.analysis.confidence.final_score}."
            ),
        )
    )

    response_planner = run_response_planner(scenario, situation_analyst)
    logs.append(
        AgentLog(
            agent_name=AgentName.RESPONSE_PLANNER,
            message=f"Generated {len(response_planner.plan.actions)} action(s).",
        )
    )

    execution_simulator = run_execution_simulator(scenario, situation_analyst, response_planner)
    logs.append(
        AgentLog(
            agent_name=AgentName.EXECUTION_SIMULATOR,
            message=execution_simulator.execution.system_status,
        )
    )

    impact_reporter = run_impact_reporter(
        situation_analyst,
        response_planner,
        execution_simulator,
    )
    logs.append(
        AgentLog(
            agent_name=AgentName.IMPACT_REPORTER,
            message=impact_reporter.report.summary,
        )
    )

    return PipelineResult(
        scenario=scenario,
        signal_watcher=signal_watcher,
        crisis_detector=crisis_detector,
        situation_analyst=situation_analyst,
        response_planner=response_planner,
        execution_simulator=execution_simulator,
        impact_reporter=impact_reporter,
        final_status=situation_analyst.analysis.escalation,
        logs=logs,
    )


def run_pipeline_by_id(scenario_id: str) -> PipelineResult:
    return run_pipeline(get_scenario(scenario_id))


def main() -> None:
    scenario_id = sys.argv[1] if len(sys.argv) > 1 else "scenario_1"
    result = run_pipeline_by_id(scenario_id)
    print(result.model_dump_json(indent=2))


if __name__ == "__main__":
    main()
