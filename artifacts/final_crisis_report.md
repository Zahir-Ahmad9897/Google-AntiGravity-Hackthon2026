# Final Crisis Report: Custom approved crisis signal - mardan bazar

- Final crisis level: crisis
- Final confidence: 0.7
- Final risk score: 0.7
- Human approval: approved_for_simulation
- Safety: simulation only; no real emergency integrations used.

## Iteration Summary
- Iteration 1: Initial detection baseline established. Simulated response for Major accident and road blockage detected in Islamabad: 1 route update(s), 1 alert(s), and 1 emergency ticket(s).
  Next step: Continue monitoring and run the next iteration with updated signals.
- Iteration 2: Re-planned: risk level stayed similar but latest signals updated the plan. Simulated response for Major accident and road blockage detected in Islamabad: 1 route update(s), 1 alert(s), and 1 emergency ticket(s).
  Next step: Continue monitoring and run the next iteration with updated signals.
- Iteration 3: Re-planned: risk level stayed similar but latest signals updated the plan. Simulated response for Major accident and road blockage detected in Islamabad: 1 route update(s), 1 alert(s), and 1 emergency ticket(s).
  Next step: Finalize crisis report and preserve artifacts for review.

## Final Reasoning Summary
Major accident and road blockage detected in Islamabad with severity 3/5, confidence 0.7, and affected roads mardan bazar.

## Latest Simulated Plan
- dispatch_emergency -> Islamabad: Dispatch response unit from F-8 Rescue Station to Islamabad.
- send_alert -> Islamabad: Send public alert for Major accident and road blockage detected in Islamabad.
- reroute_traffic -> Khayaban-e-Iqbal: Update mock map routing away from Khayaban-e-Iqbal.