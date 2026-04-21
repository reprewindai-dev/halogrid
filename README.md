# HaloGrid

HaloGrid is the console frontend for CO2 Router.

Role of this repo:

- Console frontend only
- Not the root website
- Not the engine
- Never calls the engine directly
- Calls `ecobe-mvp` only

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
