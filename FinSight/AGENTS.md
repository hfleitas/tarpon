# FinSight — Operations Console (Rayfin app) — notes for the AI agent

This project is a Rayfin app (Backend-as-a-Service on Microsoft Fabric). It is
NOT an Embr app: do not add server.js, api/db.js, embr.yaml, SSE, WebSockets, or
Postgres here.

## What it is
An **operational console that complements the Truist Fabric demo**
(`hfleitas/tarpon` → `fabric/truist-demo`). The Fabric bundle is the analytical
layer (Lakehouse + notebooks + semantic model + Power BI dashboards) across four
areas: risk discipline, digital efficiency, treasury modernization, AML
automation. FinSight is the operational layer where staff ACT on those signals.

## Domains → views
- AML automation → `src/views/AmlView.tsx` (entity `AmlCase`)
- Risk discipline → `src/views/CreditView.tsx` (entity `CreditReview`)
- Treasury modernization → `src/views/TreasuryView.tsx` (entity `TreasuryAction`)
- Digital efficiency → `src/views/DigitalView.tsx` (entity `DigitalInitiative`)
- Executive rollup → `src/views/OverviewView.tsx`

## Data
- Data model: TypeScript @entity classes in `rayfin/data/` (AmlCase,
  CreditReview, TreasuryAction, DigitalInitiative), registered in
  `rayfin/data/schema.ts`.
- Frontend data access goes through `src/services/finsight.ts`, which uses the
  client from `src/rayfin/client.ts` —
  `client.data.<Entity>.select([...]).orderBy({...}).execute()` / create / update /
  findById / delete, and `client.auth.*`.
- Preview here uses an in-memory MOCK (`src/rayfin/mockClient.ts`) seeded by
  `src/rayfin/seed.ts` so the app runs offline with realistic Fabric-demo figures.

## When changing the data model, keep these in sync
1. the `@entity` class in `rayfin/data/`
2. `rayfin/data/schema.ts` (register it)
3. `src/rayfin/schema.ts` (mirror the TS type + `FinSightAppSchema`)
4. `src/rayfin/seed.ts` (preview seed rows)
5. `src/services/finsight.ts` + the view that uses it

## Design
Fabric / Power BI look — tokens in `src/theme.ts`, primitives in
`src/components/`. Soft lavender-purple canvas, floating white cards, Truist
Purple primary with a Truist Teal accent, GBP/JPY/EUR/USD/CAD currency colors,
tabular KPI numbers, and a "Confidential · Internal Only" sensitivity pill.
Keep this cohesive when editing.

Deploy to real Fabric is done with the rayfin CLI (`rayfin up`), outside the
preview.
