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

## Build

Create the production bundle:

```bash
npm run build
```

This runs TypeScript compilation, builds the Vite app, and writes the static output to `dist/`.

## Deploy with Rayfin

Deploy the app with Rayfin static hosting:

```bash
npm run deploy
```

This runs `rayfin up` using the app configuration in `rayfin/rayfin.yml`. Make sure you are authenticated and targeting the correct Rayfin or Fabric environment before deploying.
