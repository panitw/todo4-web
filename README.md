This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

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
