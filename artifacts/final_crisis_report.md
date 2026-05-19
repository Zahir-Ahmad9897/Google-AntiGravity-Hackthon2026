# Final Crisis Report: Peshawar Ring Road blast and blockage

- Final crisis level: crisis
- Final confidence: 0.7
- Final risk score: 0.7
- Human approval: approved_for_simulation
- Safety: simulation only; no real emergency integrations used.

## Iteration Summary
- Iteration 1: Initial detection baseline established. No confirmed crisis impact: CIRO stayed in monitoring mode.
  Next step: Continue monitoring and run the next iteration with updated signals.
- Iteration 2: Escalated: risk increased by 0.31. Simulated response for Major accident and road blockage detected in Peshawar Ring Road: 2 route update(s), 1 alert(s), and 1 emergency ticket(s).
  Next step: Continue monitoring and run the next iteration with updated signals.
- Iteration 3: De-escalated: risk decreased by 0.12. Simulated response for Road blockage detected in Peshawar Ring Road: 1 route update(s), 1 alert(s), and 1 emergency ticket(s).
  Next step: Finalize crisis report and preserve artifacts for review.

## Final Reasoning Summary
Road blockage detected in Peshawar Ring Road with severity 3/5, confidence 0.7, and affected roads Peshawar Ring Road.

## Latest Simulated Plan
- dispatch_emergency -> Peshawar Ring Road: Dispatch response unit from Peshawar Ring Road Simulation Depot to Peshawar Ring Road.
- send_alert -> Peshawar Ring Road: Send public alert for Road blockage detected in Peshawar Ring Road.
- reroute_traffic -> Peshawar Ring Road: Update mock map routing away from Peshawar Ring Road.