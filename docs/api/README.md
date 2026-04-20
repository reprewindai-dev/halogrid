# CO2 Router API Catalog

This folder is the source of truth for the Redocly API catalog wired into Reunite.

The catalog is split into three production-facing surfaces:

- `co2-router-control-surface@v1` for the public dashboard and control-surface APIs
- `co2-router-engine@v1` for the engine health, CI, routing, and water/provenance APIs
- `co2-router-integrations@v1` for webhooks, outbox, and DEKES integration endpoints

Each API is documented as a standalone OpenAPI file so Reunite can render the catalog, branch previews, and production deployments directly from Git.
