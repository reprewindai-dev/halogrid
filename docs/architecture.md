# HaloGrid Console Architecture

## Scope

HaloGrid is the console frontend only.

It is pinned to `ecobe-mvp` and must not call any backend bypass surface.

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
