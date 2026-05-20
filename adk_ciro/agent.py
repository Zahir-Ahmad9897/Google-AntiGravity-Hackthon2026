from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

from adk_ciro.tools import CIRO_ADK_TOOLS


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = PROJECT_ROOT / ".env"
SYSTEM_PROMPT_PATH = Path(__file__).resolve().parent / "ciro_system_prompt.md"
load_dotenv(dotenv_path=ENV_PATH)

GOOGLE_API_KEY_DETECTED = bool(os.getenv("GOOGLE_API_KEY"))
if GOOGLE_API_KEY_DETECTED:
    print("CIRO ADK auth debug: GOOGLE_API_KEY detected=True")
else:
    print(
        "CIRO ADK auth error: GOOGLE_API_KEY detected=False. "
        f"Add GOOGLE_API_KEY=your_key_here to {ENV_PATH}"
    )

# Force Gemini Developer API mode unless the user explicitly configured Vertex AI.
os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "False")

MODEL_NAME = os.getenv("CIRO_ADK_MODEL", "gemini-2.0-flash")

# Load the full CIRO system prompt from the canonical markdown file.
# Falls back to an inline summary if the file is missing.
if SYSTEM_PROMPT_PATH.exists():
    _SYSTEM_PROMPT = SYSTEM_PROMPT_PATH.read_text(encoding="utf-8").strip()
    print(f"CIRO ADK startup: loaded system prompt from {SYSTEM_PROMPT_PATH.name} ({len(_SYSTEM_PROMPT)} chars)")
else:
    _SYSTEM_PROMPT = ""
    print(f"CIRO ADK startup warning: {SYSTEM_PROMPT_PATH} not found, using inline fallback")

# The ADK-specific orchestration instructions that tell Gemini HOW to use the
# deterministic Python tools. These wrap the full identity/pipeline prompt.
_ADK_TOOL_INSTRUCTIONS = """
## ADK TOOL ORCHESTRATION

You have access to deterministic Python tools that implement the CIRO backend pipeline.
Use Gemini reasoning to plan the tool sequence, but rely on these tools for scoring,
verification, planning, artifacts, and simulated actions.

Required flow:
1. Call list_iterative_scenarios_tool if the user has not specified a scenario.
2. Call run_iterative_ciro_pipeline_tool for the chosen scenario. It executes three
   iterations and calls all 9 agents: CIRO Commander, Weather Risk, Traffic Analysis,
   Social/Public Signal, Verification, Crisis Reasoning, Rescue Planning,
   Action Execution, and Evaluation/Replanning.
3. Use list_ciro_artifacts_tool to verify artifact creation.
4. Read final_crisis_report.md or rescue_action_plan.md if the user asks for report details.
5. Use the legacy single-pass tools only for comparison or consistency checks.

Safety rules:
- Do not expose hidden chain-of-thought; provide concise explainable summaries only.
- Do not imply secret monitoring. The Mini Assistant reads only user-approved contextual inputs.
- Do not claim real dispatch, real map updates, or real authority notifications.
  All actions are simulated and human-approved.

Your final answer must include:
- ADK plan
- tools called
- three-iteration outcome
- final confidence and crisis level
- simulated actions
- artifacts created
""".strip()

ORCHESTRATOR_INSTRUCTION = (
    f"{_SYSTEM_PROMPT}\n\n---\n\n{_ADK_TOOL_INSTRUCTIONS}"
    if _SYSTEM_PROMPT
    else _ADK_TOOL_INSTRUCTIONS
)


@dataclass
class FallbackAgent:
    name: str
    model: str
    instruction: str
    tools: list[Any]
    adk_available: bool
    import_error: str


try:
    from google.adk.agents import Agent

    ADK_AVAILABLE = True
    ADK_IMPORT_ERROR = ""
    print(f"CIRO ADK startup: creating Gemini root_agent with model={MODEL_NAME}")
    root_agent = Agent(
        name="ciro_orchestrator",
        model=MODEL_NAME,
        description="CIRO Gemini/ADK orchestrator for crisis planning, decision, execution, and impact.",
        instruction=ORCHESTRATOR_INSTRUCTION,
        tools=CIRO_ADK_TOOLS,
    )
except Exception as exc:
    ADK_AVAILABLE = False
    ADK_IMPORT_ERROR = str(exc)
    root_agent = FallbackAgent(
        name="ciro_orchestrator",
        model=MODEL_NAME,
        instruction=ORCHESTRATOR_INSTRUCTION,
        tools=CIRO_ADK_TOOLS,
        adk_available=False,
        import_error=ADK_IMPORT_ERROR,
    )
