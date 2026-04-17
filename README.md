# HaloGrid — CO₂ Router Control Plane

Carbon-aware routing dashboard built with React + Vite + Tailwind + Framer Motion.

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

Open http://localhost:5173

## Tiers
| Tier     | Features                                      |
|----------|-----------------------------------------------|
| Freeview | Region list, globe, basic metrics             |
| Core     | + Signal providers, decision stream, confidence |
| Elite    | + Trace rail, proof hashes, full audit log    |

## Project Structure
```
src/
├── components/   UI components
├── hooks/        useSimulation — live data engine
├── lib/          utils, simulation engine, constants
├── types/        TypeScript interfaces
└── styles/       Global CSS + Tailwind
```
