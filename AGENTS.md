# CIRO Agent Instructions

## Project
CIRO — Crisis Intelligence & Response Orchestrator

## Core Architecture
- Iterative multi-agent crisis-response system
- Google ADK orchestration
- Gemini reasoning
- Artifact-first workflow
- Simulation-only actions

## Core Loop
Observe → Verify → Reason → Plan → Act → Evaluate → Re-plan

## Critical Rules
- Do NOT rebuild architecture unnecessarily
- Preserve existing working modules
- Prefer incremental modifications
- UI is secondary
- Focus on orchestration and reasoning
- Never expose chain-of-thought
- Save concise reasoning traces only
- Human approval required before simulated execution

## Agent Structure
- CIRO Commander Agent
- Weather Risk Agent
- Traffic Analysis Agent
- Social/Public Signal Agent
- Verification Agent
- Crisis Reasoning Agent
- Rescue Planning Agent
- Action Execution Agent
- Evaluation/Replanning Agent

## Artifacts
Save:
- decision traces
- risk scores
- action plans
- evaluation summaries
- replanning traces

Location:
artifacts/

## Development Rules
- Analyze before modifying
- Avoid duplicate logic
- Preserve runnable state
- Make modular changes
- Verify after each major step

## Dashboard Priority
Minimal UI.
Main focus:
- reasoning
- orchestration
- iteration
- explainability

## Safety
- No real emergency integrations
- Simulation only
- Privacy-first
- Permission-based contextual signal analysis only