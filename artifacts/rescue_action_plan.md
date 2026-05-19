# Rescue Action Plan: Peshawar Ring Road blast and blockage

Approval status: **approved_for_simulation**

All actions below are simulated. No public alert, route API, or emergency authority was contacted.

## Iteration 1
- Crisis level: no_escalation
- Confidence: 0.5
- Risk score: 0.51
- Action plan:
  - Monitor only; no simulated emergency action generated.

## Iteration 2
- Crisis level: crisis
- Confidence: 0.8
- Risk score: 0.82
- Action plan:
  - dispatch_emergency -> Peshawar Ring Road: Dispatch response unit from Peshawar Ring Road Simulation Depot to Peshawar Ring Road.
  - send_alert -> Peshawar Ring Road: Send public alert for Major accident and road blockage detected in Peshawar Ring Road.
  - reroute_traffic -> Peshawar Ring Road: Update mock map routing away from Peshawar Ring Road.
  - reroute_traffic -> University Road diversion: Update mock map routing away from University Road diversion.

## Iteration 3
- Crisis level: crisis
- Confidence: 0.7
- Risk score: 0.7
- Action plan:
  - dispatch_emergency -> Peshawar Ring Road: Dispatch response unit from Peshawar Ring Road Simulation Depot to Peshawar Ring Road.
  - send_alert -> Peshawar Ring Road: Send public alert for Road blockage detected in Peshawar Ring Road.
  - reroute_traffic -> Peshawar Ring Road: Update mock map routing away from Peshawar Ring Road.
