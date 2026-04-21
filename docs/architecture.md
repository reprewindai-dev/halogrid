# HaloGrid Console Architecture

## Scope

HaloGrid is the control/view layer only.

It is pinned to `ecobe-mvp` and must not call any backend bypass surface.

## Architecture Contract

- HaloGrid communicates exclusively with `ecobe-mvp`.
- HaloGrid never calls `ecobe-engine-claude` or any other internal service directly.
- HaloGrid does not store policy logic locally.
- `ecobe-mvp` is the only approved frontend-facing backend surface.
- The UI is limited to dashboard, policy management, and proof/log viewing.

## Frontend API Expectations

- `GET /policies`
- `POST /policies`
- `GET /proof-records` as the canonical proof/history endpoint if available

Proof-like decision history powers the Dashboard and Logs views.

## Data Flow

`ecobe-mvp` -> `src/lib/ecobeMvpApi.ts` -> `src/App.tsx` -> console panels

## Render Guarantees

- The console always renders a structured shell.
- The simulation surface is disabled.
- No blank shell is allowed on first paint.
- No live-surface wording is derived from fake telemetry.

## Runtime Surface

- Top bar: backend target, connection state, refresh control
- Left panel: contract, guardrails, metrics, surface summary
- Center: static console canvas
- Right panel: integrations and activity rail
- Bottom bar: status and enforcement summary
