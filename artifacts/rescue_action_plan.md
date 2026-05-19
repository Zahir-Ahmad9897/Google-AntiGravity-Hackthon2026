# Rescue Action Plan: Islamabad G-10 urban flooding

Approval status: **approved_for_simulation**

All actions below are simulated. No public alert, route API, or emergency authority was contacted.

## Iteration 1
- Crisis level: no_escalation
- Confidence: 0.5
- Risk score: 0.47
- Action plan:
  - Monitor only; no simulated emergency action generated.

## Iteration 2
- Crisis level: crisis
- Confidence: 1.0
- Risk score: 0.93
- Action plan:
  - dispatch_emergency -> G-10: Dispatch response unit from G-6 Markaz Emergency Centre to G-10.
  - send_alert -> G-10: Send public alert for Urban flooding detected in G-10.
  - reroute_traffic -> Khayaban-e-Iqbal: Update mock map routing away from Khayaban-e-Iqbal.
  - reroute_traffic -> Margalla Road sector crossing: Update mock map routing away from Margalla Road sector crossing.
  - open_shelter -> G-10 Community Centre: Prepare intake capacity at G-10 Community Centre.

## Iteration 3
- Crisis level: crisis
- Confidence: 0.9
- Risk score: 0.86
- Action plan:
  - dispatch_emergency -> Margalla Road sector crossing: Dispatch response unit from G-6 Markaz Emergency Centre to Margalla Road sector crossing.
  - send_alert -> Margalla Road sector crossing: Send public alert for Urban flooding detected in Margalla Road sector crossing.
  - reroute_traffic -> Margalla Road sector crossing: Update mock map routing away from Margalla Road sector crossing.
  - open_shelter -> H-9 Livestock Ground: Prepare intake capacity at H-9 Livestock Ground.
