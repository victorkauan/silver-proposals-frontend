# Contributing

## Development setup

```bash
cp .env.example .env
npm ci
uv tool install pre-commit   # or: pipx install pre-commit
pre-commit install
```

`pre-commit install` registers two Git hooks:

| Hook         | Runs                                                                                     |
| ------------ | ---------------------------------------------------------------------------------------- |
| `pre-commit` | file hygiene checks, gitleaks (secret scanning), Prettier, oxlint, TypeScript type check |
| `commit-msg` | Conventional Commits validation                                                          |

Run every hook against the whole repository with `pre-commit run --all-files`.

## Branches

Create one branch per issue, named `<type>/SIL-<n>`, for example `feat/SIL-205`.
`main` only receives changes through pull requests, and every merge is a squash merge.

## Commits

Commits follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>(<scope>): <imperative subject, lowercase, no period, up to 72 characters>
```

- **Types:** `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `style`, `revert`
- **Scopes:** `auth`, `proposals`, `editor`, `sharing`, `ui`, `api-client`, `config`, `deps`
- Breaking changes add `!` after the scope and a `BREAKING CHANGE:` footer.
- Commit messages do not include issue IDs.

## Pull requests

- **Title:** `<type>(<scope>): <subject> [SIL-<n>]`. When squash-merging, remove the `[SIL-<n>]` suffix from the commit title.
- **Description:** fill in every section of the template. Write `N/A` where a section does not apply.
- Use `Closes SIL-<n>` when the PR completes the issue, and `Refs SIL-<n>` otherwise.
- Keep PRs small: one issue per PR, ideally under 400 changed lines.

## Definition of done

- Hooks and CI pass.
- Tests cover the new behavior.
- Documentation in `docs/` or the README is updated in the same PR.
- File names follow the naming convention in the README (kebab-case, `<name>/index.tsx`, `<name>.<role>.ts`).
- Code comments appear only where the code cannot explain a decision.
