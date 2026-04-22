# CO2 Grid Architecture

## Data Flow
Simulation engine (lib/simulation.ts) → useSimulation hook → React state → Components

## Key Concepts
- **Region** — A cloud datacenter node with live carbon, load, water stress signals
- **Decision** — A routing action taken by the CO2 Router engine
- **TraceFrame** — Cryptographic proof entry for Elite tier audit log
- **Tier** — Feature gate: Freeview / Core / Elite

## Simulation Loop
Runs on `setInterval` at 2200ms (Core/Elite) or 4000ms (Freeview).
Each tick: regions get stochastic carbon/load drift → router fires decisions → metrics recalc.
