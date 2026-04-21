# CO2 Grid - CO2 Router Control Plane

Carbon-aware routing dashboard built with React, Vite, Tailwind, and Framer Motion.

## Stack
- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3
- Framer Motion 11
- Recharts 2
- Lucide React

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

Set `VITE_MCP_API_BASE` to the approved broker URL (for example `https://<mcp-host>/api/v1`) in production environments.

## Tiers
| Tier | Features |
| --- | --- |
| Freeview | Region list, globe, basic metrics |
| Core | Signal providers, decision stream, confidence |
| Elite | Trace rail, proof hashes, full audit log |

## Project Structure

```text
src/
|-- components/   UI components
|-- hooks/        Client hooks
|-- lib/          Utilities and backend helpers
|-- types/        TypeScript interfaces
`-- styles/       Global CSS + Tailwind
```
