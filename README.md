# Silver Proposals — Frontend

[![CI](https://github.com/victorkauan/silver-proposals-frontend/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/victorkauan/silver-proposals-frontend/actions/workflows/ci.yml)

Web application for **Silver Proposals**, an AI-powered SaaS for creating and managing commercial proposals.
Built with React, TypeScript, Vite, Tailwind CSS v4, and shadcn/ui. The static build is published to Amazon S3 behind CloudFront.

| Repository                                                                          | Responsibility                                       |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [silver-proposals-backend](https://github.com/victorkauan/silver-proposals-backend) | FastAPI API, container image published to ECR        |
| **silver-proposals-frontend** (this repo)                                           | React SPA, static build published to S3 + CloudFront |
| [silver-proposals-infra](https://github.com/victorkauan/silver-proposals-infra)     | Terraform for AWS and Cloudflare                     |

Why three repositories: [ADR-0001](https://github.com/victorkauan/silver-proposals-infra/blob/main/docs/adr/0001-three-repositories.md).

## Requirements

- Node.js 24 (see `.nvmrc`)

## Quick start

```bash
cp .env.example .env
npm ci
npm run dev
```

The app runs at <http://localhost:5173>.

## With the local API

1. Start the backend locally, following the backend's
   [local environment](https://github.com/victorkauan/silver-proposals-backend#local-environment) guide.
   The API listens on <http://localhost:8000>.
2. Point the frontend at it in `.env`:

   ```bash
   VITE_API_BASE_URL=http://localhost:8000
   ```

3. Run `npm run dev`. Vite only reads `.env` at startup, so restart it after changing the file.

## Contributing

Install the Git hooks before your first commit:

```bash
uv tool install pre-commit   # or: pipx install pre-commit
pre-commit install
```

Branch, commit, and pull request conventions are in [CONTRIBUTING.md](CONTRIBUTING.md).
Security issues: see [SECURITY.md](SECURITY.md).

## Quality checks

```bash
npm run lint
npm run format:check
npm run typecheck
npm run test:coverage
```

## End-to-end tests

The Playwright suite runs against the **real API** with the fake AI provider, so no Bedrock call is ever made.
It builds the app and serves it on `http://localhost:5173`, the only origin the local API allows for CORS and its
`SameSite=Strict` refresh cookie. It covers sign-up and login, generating a proposal from a briefing, editing and
saving it, the version history, and creating, opening, and revoking a share link, plus an unknown share link.

1. Start the backend with Docker Compose and run its migrations (see the backend's
   [local environment](https://github.com/victorkauan/silver-proposals-backend#local-environment) guide).
2. Stop `npm run dev` if it is running, because the suite needs port 5173.
3. Run the suite:

   ```bash
   npx playwright install --with-deps chromium   # once
   npm run test:e2e
   ```

   If your machine cannot run Playwright's browsers (for example, WSL without the system libraries), use the
   official image instead. It runs inside the API container's network, so the URLs are the same as above:

   ```bash
   ./scripts/e2e-docker.sh
   ```

Set `E2E_API_URL` to point the suite at another API. In CI, the `e2e` job checks out the backend's `main` branch,
starts it with Docker Compose, and runs the same suite.

## Continuous integration

GitHub Actions runs on every pull request and on every push to `main`:

| Workflow                                   | Job        | Checks                                                                                                  |
| ------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------- |
| [CI](.github/workflows/ci.yml)             | `quality`  | Prettier, oxlint, TypeScript, Vitest with coverage (minimum 80%)                                        |
|                                            | `e2e`      | Playwright suite on Chromium against the real API (backend `main`, fake AI); report uploaded on failure |
|                                            | `build`    | production build                                                                                        |
| [PR title](.github/workflows/pr-title.yml) | `pr-title` | Conventional Commits title ending with `[SIL-<n>]`                                                      |

The coverage report is published in each run's summary.

## Build

```bash
npm run build   # output in dist/
```

## Layout

```
src/
  main.tsx        # entry point
  @shared/        # cross-cutting code: config/, helpers/, test/, shadcn/ui components (components/ui)
  features/       # one folder per feature; app/ is the current shell
e2e/              # Playwright end-to-end tests
scripts/          # e2e-docker.sh: run the e2e suite in the Playwright image
```

File names are kebab-case and enforced by oxlint. Components live in folders (`components/proposal-card/index.tsx`),
and other files carry their role as a suffix (`proposal.type.ts`, `date.helper.ts`, `env.config.ts`).
Unit tests live next to the code they test (`index.test.tsx`, `date.helper.test.ts`). UI components are added with
`npx shadcn@latest add <component>` and land in `src/@shared/components/ui`.
Import with the aliases `@shared/...` and `@features/...`.

## Documentation

See [docs/README.md](docs/README.md).
