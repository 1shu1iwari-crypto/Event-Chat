# CometChat skills and documentation build log

Build date: 2 October 2026.

## Requested tooling

Executed `npx @cometchat/skills add --ide codex --family react` and `npx skills add Leonxlnx/taste-skill --agent codex --yes`. The empty repository had no detected framework or conflicting UI Kit. The resulting app uses Next.js, React, TypeScript, and CometChat React UI Kit **7.2.3**, Chat SDK **4**, Calls SDK **5.0.6**.

The installer registered the docs MCP in the local Codex configuration. That newly registered MCP was not exposed in the active agent session, so current primary documentation was fetched using the pack's documented `.md` fallback. **No implementation bundle was fetched, and no MCP execution is claimed.** The skills provided actual integration guidance; this log records the distinction explicitly.

## Skill guidance used

- CometChat dispatcher and onboarding: platform detection, UI Kit first, SDK/REST fallback where necessary.
- React v7 core: init → token login → provider/render, StrictMode promise guard, error boundary, component props and slots.
- Patterns/SSR: browser-only runtime through `next/dynamic` in a client wrapper with SSR disabled.
- Calls: separate v5 SDK, `uiKit.callsSDK` on `initFromSettings`, root incoming-call surface, built-in header controls, group join semantics.
- Production: server-only credentials and server-derived authenticated UID for token exchange.
- Core references: credential setup, lifecycle, component props, theming, docs map.
- Taste minimalist guidance: flat surfaces, compact geometry, typographic hierarchy, restrained semantic colors. The operations brief takes precedence over marketing-specific hero/bento prescriptions.

## Live primary documentation queried/read

| Topic | Documentation |
| --- | --- |
| Next.js initialization and SSR | https://www.cometchat.com/docs/ui-kit/react/integration-nextjs |
| CSS theme tokens | https://www.cometchat.com/docs/ui-kit/react/theming |
| Confirmed-send / receive / presence events | https://www.cometchat.com/docs/ui-kit/react/event-system |
| Thread composition | https://www.cometchat.com/docs/ui-kit/react/guide-threaded-messages |
| Scoped message search and result navigation | https://www.cometchat.com/docs/ui-kit/react/guide-search-messages |
| Groups, users, message list, search, group members, thread header, call buttons | Corresponding `/ui-kit/react/components/<component>` pages |
| Scoped SDK methods and group retrieval | https://www.cometchat.com/docs/sdk/javascript/llms-javascript-v4 and `/retrieve-groups` |
| Presence and received-message contracts | `/sdk/javascript/user-presence` and `/receive-message` |
| User creation | https://www.cometchat.com/docs/rest-api/users/create |
| Private group creation and initial members | https://www.cometchat.com/docs/rest-api/groups/create |
| Add/list group members | https://www.cometchat.com/docs/rest-api/group-members/add-members and `/list` |
| Message sending / read-back | https://www.cometchat.com/docs/rest-api/messages/send-message and `/get-message` |
| Server token exchange | https://www.cometchat.com/docs/rest-api/auth-tokens/create |
| Webhook scope investigation | https://www.cometchat.com/docs/sdk/javascript/webhooks |

Guessed flat REST documentation paths returned the docs home page. Those responses were discarded; canonical links were resolved from the resource overview pages before implementation. SDK internals or `.d.ts` files were not used as API documentation.

## Major decisions

1. Use real prebuilt UI Kit conversation components rather than a static imitation.
2. Use the skills' `initFromSettings` path for AI-agent attribution and calling initialization; cache its promise and never render before login.
3. Use full-access server REST credentials for private group provisioning, verified membership, scenario send-as, and token minting. Browser credentials consist of a user token only.
4. Send a readable coordinator brief as a normal message; render the linked incident card through the message-list header slot.
5. Preserve threads, scoped search/back navigation, attachments, receipts, and calling through actual kit components.
6. Verify per-user room membership after adding members; do not treat partial HTTP 200 results as a completed room.
7. Use confirmed-send and network receive events, then server read-back, instead of an unconfigured webhook dependency.
8. Keep explicit disconnected/error states. Local engine exercises do not render fake messages or calls.

## Credential validation and remote action status

Dashboard CLI login completed and an existing India-region app was selected. A read-only REST users request succeeded, proving the credential supports server access. The credentials remain in ignored local files.

Automatic approval review **rejected** the remote seed script because creating users/groups was judged broader than the explicit authorization. No workaround or remote retry was performed. A subsequent read-only check found **zero `eventops-` demo users**. Live seed, room creation, message send/receive, presence, and calls remain pending explicit approval and live validation.

See `VERIFICATION.md` for application checks performed independently of those remote actions.

## Smartphone redesign

The taste pack's `redesign-existing-projects` guidance was applied to improve layout, type, navigation, touch controls, and empty states. CometChat customization/core guidance and the current official theming Markdown were read. `CometChatProvider` now uses `theme="light"`, with confirmed theme tokens scoped to `.cometchat[data-theme="light"]`. The response chat retains its bounded dimensions and existing threads, search, calls, and token login. No remote provisioning or live messages were attempted for this visual change.
