# CO2 Grid

CO2 Grid is the console frontend for CO2 Router.

## Architecture Contract

CO2 Grid is a control-plane UI only.

- CO2 Grid communicates exclusively with the approved backend.
- CO2 Grid never calls `ecobe-engine-claude` or any other internal service directly.
- CO2 Grid does not store policy logic locally.
- The approved backend is the only frontend-facing backend surface.
- Dashboard, Policies, and Logs all render data exposed by the backend.

## Frontend API Expectations

Expected backend capabilities for the current UI:

- `GET /policies`
- `POST /policies`
- `GET /proof-records` as the canonical proof/history endpoint if available

Proof-like decision history powers the Dashboard and Logs views.

Role of this repo:

- Console frontend only
- Not the root website
- Not the engine
- Never calls the engine directly
- Calls the approved backend only

## Run

```bash
npm install
npm run dev
```

## Backend target

Set `VITE_ECOBE_MVP_BASE_URL` when the console is deployed behind a different proxy path.

Default:

```text
/api/ecobe-mvp
```

## Notes

- Simulation state has been removed from the live console surface.
- Blank-shell behavior is guarded by a deterministic console layout.
- Backend bypass is blocked at the frontend contract level.
