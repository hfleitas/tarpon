# FinSight

FinSight is a Rayfin app that turns the Truist Fabric demo into an operational console. It gives teams a place to act on signals across AML automation, credit risk, treasury modernization, and digital efficiency.

## What is in this app

- Executive Command Center rollup across all four domains
- AML case management workflow
- Credit review and early warning workflow
- Treasury action tracking
- Digital initiative tracking

The local preview uses the in-memory mock client in `src/rayfin/mockClient.ts`, so you can run the UI without a live Fabric backend.

## Prerequisites

- Node.js 20+
- npm
- Rayfin CLI access for environment sync and deployment

Install dependencies once:

```bash
npm install
```

## Develop locally

Run the Vite dev server:

```bash
npm run dev
```

`predev` runs `rayfin env --framework vite` first, so the local app picks up the Rayfin environment before starting on `http://localhost:5173`.

## Semantic model integration (Truist Executive Command Center)

The Executive Command Center KPI strip attempts to read live metrics from the Power BI semantic model:

- Workspace: `09fd4407-ad4f-42a6-92cd-c69bccd5daa1` (Tarpon)
- Dataset: `e4d94e70-621c-402c-b997-5ea9c178b06f` (Truist Executive Command Center)

Optional environment overrides:

- `VITE_EXECUTIVE_COMMAND_CENTER_WORKSPACE_ID`
- `VITE_EXECUTIVE_COMMAND_CENTER_DATASET_ID`
- `VITE_EXECUTIVE_COMMAND_CENTER_DATASET_NAME`
- `VITE_POWERBI_API_BASE_URL` (defaults to `https://api.powerbi.com`)
- `VITE_POWERBI_BEARER_TOKEN` (optional; when omitted, the app attempts cookie-based auth)

If semantic-model query access is unavailable, FinSight falls back to Rayfin operational data for KPIs.

## Build

Create the production bundle:

```bash
npm run build
```

This runs TypeScript compilation for both the app and Rayfin data model, builds the Vite app, and writes the static output to `dist/`.

## Deploy with Rayfin

Deploy the app with Rayfin static hosting:

```bash
npm run deploy
```

This runs `rayfin up` using the app configuration in `rayfin/rayfin.yml`. Make sure you are authenticated and targeting the correct Rayfin or Fabric environment before deploying.

Keep `rayfin/rayfin.yml` portable by checking in only the localhost redirect URI. After deployment, add the environment's hosted app URL to `allowedRedirectUris` through your environment-specific deployment workflow before testing interactive sign-in on the public Fabric Apps URL.
