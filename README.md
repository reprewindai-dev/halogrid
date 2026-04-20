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

## Upstash QStash Quickstart

The engine uses `QSTASH_BASE_URL` and `QSTASH_TOKEN`. Keep the region URL and token paired.

### EU region

```env
QSTASH_BASE_URL=https://qstash.upstash.io
QSTASH_TOKEN=your_eu_token
QSTASH_CURRENT_SIGNING_KEY=your_eu_current_key
QSTASH_NEXT_SIGNING_KEY=your_eu_next_key
```

### US region

```env
QSTASH_BASE_URL=https://qstash-us-east-1.upstash.io
QSTASH_TOKEN=your_us_token
QSTASH_CURRENT_SIGNING_KEY=your_us_current_key
QSTASH_NEXT_SIGNING_KEY=your_us_next_key
```

### JavaScript publish example

```ts
import { Client } from '@upstash/qstash'

const client = new Client({
  token: process.env.QSTASH_TOKEN!,
  baseUrl: process.env.QSTASH_BASE_URL,
})

await client.publishJSON({
  url: 'https://your-engine.example.com/api/v1/intelligence/jobs/accuracy',
  body: { job: 'intelligence-accuracy' },
})
```

## Tiers
| Tier     | Features                                      |
|----------|-----------------------------------------------|
| Freeview | Region list, globe, basic metrics             |
| Core     | + Signal providers, decision stream, confidence |
| Elite    | + Trace rail, proof hashes, full audit log    |

## Project Structure
```\
src/\
├── components/   UI components\
├── hooks/        useSimulation — live data engine\
├── lib/          utils, simulation engine, constants\
├── types/        TypeScript interfaces\
└── styles/       Global CSS + Tailwind\
```