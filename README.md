# Silver Proposals — Frontend

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
npm test
npx playwright install --with-deps chromium   # once
npm run test:e2e
```

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
```

File names are kebab-case and enforced by oxlint. Components live in folders (`components/proposal-card/index.tsx`),
and other files carry their role as a suffix (`proposal.type.ts`, `date.helper.ts`, `env.config.ts`).
Unit tests live next to the code they test (`index.test.tsx`, `date.helper.test.ts`). UI components are added with
`npx shadcn@latest add <component>` and land in `src/@shared/components/ui`.
Import with the aliases `@shared/...` and `@features/...`.

## Documentation

See [docs/README.md](docs/README.md).
