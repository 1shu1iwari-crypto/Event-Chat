# Architecture and operational limits

## Boundaries

| Area | Source | Responsibility |
| --- | --- | --- |
| Domain types | `src/types/domain.ts` | Incidents, staff, actions, signals, timelines, runs |
| Event seed | `src/lib/seed.ts` | Fictional event roster and channel names |
| AI adapter | `src/lib/ai/index.ts` | Correlation prerequisites, strict model enrichment, brief/report generation |
| Incident engine | `src/lib/incidents/engine.ts` | Idempotent ingestion, room setup, approval and assignment |
| Communication server | `src/lib/cometchat/server.ts` | REST users, private groups, membership checks, messages, per-user tokens |
| Communication client | `src/components/chat/` | Browser-only kit, init/login guard, real-time event ingestion, presence, threads/search/calls |
| Persistence | `src/lib/store.ts` | PostgreSQL row locking or serialized atomic local-file writes |
| Authentication | `src/lib/auth.ts` | Signed eight-hour HTTP-only staff demo sessions |
| API | `src/app/api/[...path]/route.ts` | Validated requests, origin checks, server-derived UID, role/state guards |
| Simulation | `src/lib/simulation/scenarios.ts` | Deterministic scenario messages |

## Communication and analysis

The browser initializes CometChat only once and obtains a token from the signed server session. UI Kit components mount only after initialization and login succeed. The application root owns incoming calls; page navigation does not create a new SDK initializer.

CometChat's `message/text-received` and successful `ui:message/sent` events submit a **message ID** to EventOps. The server reads the real message from CometChat, verifies it belongs to an operational team channel, and analyzes its text. Duplicate IDs are ignored. Scenario messages use the REST API's `onBehalfOf` header to send as fictional seeded staff, then enter the same ingestion path.

The registration detector needs queue growth, scanner failure, and a 15-minute wait from multiple reporters within five minutes. Other named scenarios need corroborating reports from two staff. Reports naming conflicting zones are not merged. Closed incidents' old supporting evidence cannot reopen them. Multiple incident categories can be detected independently in the same window.

The detector currently handles the predefined categories and zones; it is not a general-purpose classifier for arbitrary event failures. LLM enrichment in LIVE mode provides tentative explanations/confidence for a rules-detected incident. It cannot invent actions or write assignments. Medical/security/safety paths remain human-escalation recommendations.

Incident creation provisions a private group with responders and the coordinator. Per-member success is checked by reading the actual room roster because HTTP 200 alone does not prove every member was added. An initial brief is a normal CometChat message, plus an in-app linked incident card; no custom-message API is required for the reliable path.

## Human authority

Only the Operations Lead can approve/reject/modify actions, resolve/archive incidents, seed channels, switch engine mode, reset the event, or start scenarios. Assigned room members can acknowledge and escalate. Business availability is independent of online/offline presence. Staff choices are based on availability in the seeded roster; the prototype does not claim live geolocation or guaranteed online staff selection.

Approved actions update availability and assignment records. Rejected actions do not. Duplicate decisions are rejected. Busy staff cannot be assigned to a different incident. Resolution releases staff whose assignment points to that incident and keeps the audit timeline.

## Storage and concurrency

PostgreSQL stores the event as one JSON document and serializes mutations with a row lock. This is a simple durable prototype boundary, not a high-throughput event-sourcing design. Remote room/message operations can hold the lock; production should move those into an outbox/worker to reduce contention and retry side effects safely.

Without PostgreSQL, mutations are serialized in-process and committed with an atomic rename to `.data/event.json`. This mode is suitable for one local Node process. It does not support horizontal scaling or ephemeral serverless storage. There is currently one event workspace, not tenant isolation.

Simulation state is durable when PostgreSQL is configured, but progression is driven by authenticated requests from the Operations Lead browser. No background scheduler is required; closing that browser pauses the scenario. Reset chooses a new room namespace and retains existing CometChat conversations.

## Explicit prototype limits

- Shared demo access code and role selector; not individual production identity verification.
- In-process login rate limit; use a shared store for public deployment.
- Whole-event state is visible to authenticated demo staff; private chat membership still limits response-room conversations.
- File persistence and PostgreSQL adapter are separate; PostgreSQL needs a real configured database for deployment validation.
- No configured webhook receiver. In-app confirmed-message ingestion avoids depending on webhook setup. External clients' messages require an EventOps listener session to be observed.
- No call-duration analytics, automatic transcription, geolocation, guaranteed offline notifications, or event-ticketing features.
- Confidence values are heuristics, not validated probabilities.
- Optional model output is schema-validated and does not execute tool calls. Report text remains untrusted input.
