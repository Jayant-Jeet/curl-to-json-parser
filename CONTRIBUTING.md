# Contributing to curl-to-json-parser

Thanks for your interest in contributing! This project is Hacktoberfest-friendly and welcomes well‑scoped issues and pull requests.

- Project: `curl-to-json-parser`
- Purpose: Parse a curl command string into a structured JSON object. Includes a small CLI.
- License: MIT

If you have questions or ideas, please open an issue first so we can align on scope before you invest time in a PR.

## Quick start

1. Fork and clone the repo
2. Ensure Node.js >= 16
3. Install deps

   ```cmd
   npm install
   ```

4. Build the library (emits to `dist/`)

   ```cmd
   npm run build
   ```

5. Run the tests (they exercise the built output in `dist/`)

   ```cmd
   npm test
   ```

6. Optional: run the small smoke check

   ```cmd
   npm run test:smoke
   ```

7. For an iterative workflow, rebuild on change

   ```cmd
   npm run dev
   ```

## Repository layout

- `src/` — TypeScript sources (library and CLI)
- `dist/` — build artifacts (generated)
- `tests/` — minimal test runner (`run-tests.mjs`) and cases
- `scripts/` — smoke/utility scripts

## Scripts

- `npm run build` — build ESM and CJS bundles via tsup
- `npm run dev` — build in watch mode
- `npm test` — run the simple test suite against the built output
- `npm run test:smoke` — a tiny smoke run for the CLI
- `npm run lint` — currently a placeholder; style/lint checks are light for now

## Development notes

- TypeScript: strict mode is enabled; keep types precise and narrow.
- Minimal dependencies: please avoid adding runtime deps unless absolutely necessary.
- Small, readable functions: favor clear, testable helpers in `src/index.ts`.
- CLI: keep `src/cli.ts` zero‑dependency and fast to start.

## Tests

The repo uses a tiny custom test runner (`tests/run-tests.mjs`) for speed and portability.

- Add or extend tests inside `tests/run-tests.mjs` (follow existing `test(name, fn)` patterns).
- Tests import from `dist/`, so remember to `npm run build` before `npm test`.
- Aim to cover both happy paths and edge cases called out in the README/API docs.

If you prefer to contribute a proper test harness (e.g., Vitest), please open an issue first so we can agree on the scope and migration plan.

## Commit messages and branches

- Branch naming: `feat/<short-topic>`, `fix/<short-topic>`, `docs/<short-topic>`
- Commit style: Conventional Commits are appreciated (e.g., `feat: add -I/--head support`), but not enforced.
- Keep PRs focused: one logical change per PR with a clear description.

## Pull requests

- Open or reference an issue that the PR addresses.
- Include a short description, screenshots or sample inputs/outputs when helpful.
- Check locally:
  - `npm run build` passes
  - `npm test` passes
- Expect a quick, friendly review. Requested changes are common—don’t sweat them.

### Hacktoberfest

- This repository participates in Hacktoberfest. We welcome beginner‑friendly contributions.
- Look for issues labeled `good first issue` or `help wanted`. If you’re unsure, ask in an issue first.
- Low‑effort or spammy PRs will be marked as such. Substantive PRs that are reviewed but not merged in time may be labeled `hacktoberfest-accepted` at the maintainers’ discretion.

## Code of Conduct

By participating, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md). Please report unacceptable behavior via the issue tracker: <https://github.com/Jayant-Jeet/curl-to-json-parser/issues>.

## Security and responsible disclosure

If you discover a security issue, please do not open a public issue with exploit details. Instead, create a minimal, non‑exploitable report in issues or reach out privately via the maintainer’s GitHub profile. We’ll coordinate a safe fix and release.

## License

By contributing, you agree that your contributions will be licensed under the MIT License of this repository.
