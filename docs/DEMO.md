# 90-second EventOps walkthrough

Prerequisites: configure an existing CometChat app, seed the fictional staff/channels, and open two independent browser profiles: Maya Rao and Arjun Mehta. The top bar should say **CometChat connected**. Confirm the real call path once before recording.

| Time | Action | Point to demonstrate |
| --- | --- | --- |
| 0–10 s | Enter NovaHack as Maya and show command center | Report-driven health, venue zones, available responders |
| 10–20 s | Open Team channels | Real persistent CometChat group conversations |
| 20–32 s | Simulation lab → 1× Registration failure | Three messages from Kabir, Priya, and Ananya across two channels |
| 32–43 s | Return to command center → INC-023 | Correlated incident, linked reports, dynamically created room |
| 43–55 s | Show Observed / Inferred; acknowledge | Tentative cause kept distinct from reported evidence |
| 55–65 s | Approve the two-volunteer recommendation | Named staff become ON INCIDENT only after human approval |
| 65–75 s | Arjun replies from the second profile | Real-time delivery in the new incident conversation |
| 75–82 s | Start a short call with the Tech Lead | One-to-one ringing and connection, or join a group meeting message |
| 82–90 s | Resolve with summary and confirmed root cause | Preserved timeline, closure report, staff released |

For an instant rehearsal, choose **Instant**. The 1× primary scenario emits reports at T+0, T+4, and T+8 seconds; the operations browser advances the server-side run while it is open. If that browser closes, the run pauses and resumes when it returns.

## Manual live checks

- Send a real team-channel message and receive it in the other profile.
- Type without sending; check the kit's typing indicator.
- Check online/offline presence against the two sessions.
- Run registration failure; confirm the three messages exist in CometChat.
- Confirm the private incident room and its selected member roster exist in CometChat.
- Confirm the coordinator brief arrives as a real message.
- Search an incident message, open and close a thread, and reply in the thread.
- Approve or modify the assignment; verify staff board changes.
- Start/accept a real voice or video call on localhost or HTTPS; hang up and confirm microphone/camera release.
- Resolve the incident; check summary, root cause, timings, timeline, and staff release.
- Reset EventOps; verify fresh incident data while earlier CometChat history remains.

## Reset and failure recovery

Reset event is available only to the Operations Lead and is disabled during an active scenario. It clears application records, not remote communication history. Failed incident-room setup is explicit and retryable. A message-send failure pauses the run with its actual error.

If CometChat is absent, the lab says **Local engine exercise**. Chat/calls stay unavailable. That state can demonstrate domain behavior, but must not be presented as a working CometChat hackathon submission.

## Phone navigation

Use the bottom bar for Home, Chat, Incidents, and Team. More opens Simulation lab, metrics, and account controls. Inside an incident, use Overview for evidence and the timeline, Actions for approvals, and Response chat for the real conversation. Resolution returns to Overview with the after-action report.
