# todo-web

## Description

The web frontend for the todo4 platform. Built with Next.js 16 and React 19. Calls `todo-api` directly for all data. Provides the human oversight and management interface.

> **Package manager:** This project uses **pnpm**. Do **NOT** use `npm install` or `npm ci` — use `pnpm install` instead.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) — install with `npm install -g pnpm`
- `todo-api` running at `http://localhost:3000` (see [todo-api README](../todo-api/README.md))

## Quick Start

```bash
# 1. Copy environment file
cp .env.example .env.local

# 2. Install dependencies (use pnpm — NOT npm)
pnpm install

# 3. Start the development server
pnpm dev
# → App available at http://localhost:3001
```

> **Port conflict:** Next.js defaults to port `3000`, which conflicts with `todo-api`. The `.env.local` file already sets `PORT=3001` — just use `pnpm dev` as-is.

Visit `http://localhost:3001` in your browser to verify the app loads with no errors.

## Environment Variables

| Variable | Default | Required | Description |
|---|---|---|---|
| `API_URL` | `http://localhost:3000` | Yes | Base URL of `todo-api` — read by the Next.js server at startup (runtime, not build time) |
| `MCP_URL` | `http://localhost:3002` | Yes | Base URL of `todo-mcp` — proxied via `/mcp` route for AI agent connections |
| `NEXT_PUBLIC_SENTRY_DSN` | — | No | Sentry DSN for browser error monitoring |
| `PORT` | `3000` | No | Dev server port — set to `3001` to avoid conflict with `todo-api` |

> **Note on `NEXT_PUBLIC_*` variables:** These are inlined into the JavaScript bundle at **build time**. Changing them requires a rebuild (`pnpm build`).

## Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start development server (hot reload, uses `PORT` from `.env.local`) |
| `pnpm build` | Build for production |
| `pnpm start` | Start production build |
| `pnpm lint` | Run ESLint |

## Testing

Unit tests are configured in Story 2.x. No test commands are available yet.

## CI/CD Setup

This repository uses GitHub Actions for CI/CD. The workflow runs on every push to `main` (production) and `staging` (staging environment).

### Pipeline Steps

1. **Lint** — ESLint (via pnpm)
2. **Test** — Unit tests will be enabled in Story 2.x
3. **Build Docker image** — Multi-stage build pushed to GitHub Container Registry
4. **Deploy** — Railway deployment triggered via Railway CLI

### Required GitHub Actions Secrets

Configure these secrets in repository Settings → Secrets and variables → Actions:

| Secret | Description |
|---|---|
| `RAILWAY_TOKEN` | Railway production project token |
| `RAILWAY_TOKEN_STAGING` | Railway staging project token |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source map upload |
| `SENTRY_ORG` | Sentry organization slug |
| `SENTRY_PROJECT` | Sentry project slug for this service |

### Setup Instructions

1. Create Railway project and note the project token from Railway Settings → Tokens
2. Create Sentry project and note the auth token from User Settings → Auth Tokens
3. Add all secrets to GitHub repository Settings → Secrets
4. Push to `main` to trigger first deployment
