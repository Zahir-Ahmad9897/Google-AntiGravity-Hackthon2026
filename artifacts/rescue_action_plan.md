# Rescue Action Plan: Ambulance stuck during rain and congestion

Approval status: **approved_for_simulation**

All actions below are simulated. No public alert, route API, or emergency authority was contacted.

## Iteration 1
- Crisis level: crisis
- Confidence: 0.9
- Risk score: 0.86
- Action plan:
  - dispatch_emergency -> G-10: Dispatch response unit from G-6 Markaz Emergency Centre to G-10.
  - send_alert -> G-10: Send public alert for Urban flooding detected in G-10.
  - reroute_traffic -> Khayaban-e-Iqbal: Update mock map routing away from Khayaban-e-Iqbal.
  - open_shelter -> G-10 Community Centre: Prepare intake capacity at G-10 Community Centre.

## Iteration 2
- Crisis level: crisis
- Confidence: 1.0
- Risk score: 0.93
- Action plan:
  - dispatch_emergency -> G-10: Dispatch response unit from G-6 Markaz Emergency Centre to G-10.
  - send_alert -> G-10: Send public alert for Urban flooding detected in G-10.
  - reroute_traffic -> Khayaban-e-Iqbal: Update mock map routing away from Khayaban-e-Iqbal.
  - reroute_traffic -> Srinagar Highway G-10 underpass: Update mock map routing away from Srinagar Highway G-10 underpass.
  - open_shelter -> G-10 Community Centre: Prepare intake capacity at G-10 Community Centre.

## Iteration 3
- Crisis level: crisis
- Confidence: 0.9
- Risk score: 0.86
- Action plan:
  - dispatch_emergency -> G-10: Dispatch response unit from G-6 Markaz Emergency Centre to G-10.
  - send_alert -> G-10: Send public alert for Urban flooding detected in G-10.
  - reroute_traffic -> Srinagar Highway G-10 underpass: Update mock map routing away from Srinagar Highway G-10 underpass.
  - open_shelter -> G-10 Community Centre: Prepare intake capacity at G-10 Community Centre.
