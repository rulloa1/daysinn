# daysInn

> **Project operating context:** Read [Days Inn Housekeeping & Front Desk Tool Project Context](docs/PROJECT_CONTEXT.md) before planning features, integrations, offline behavior, or pilot work.

https://rodewayhub-pwk3xuel.manus.space

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://daysinn.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/155384a8-1dd4-4e61-8d18-1d72e87ec0db).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm ci
npm run dev
```

## Quality gate

Run the complete release-quality check locally before opening a pull request or deploying changes.

```sh
npm run verify
```

This command checks formatting, linting, TypeScript types, unit tests, and the production build in the same order used by the GitHub Actions workflow. The workflow also runs a production dependency audit that blocks high-severity findings. It runs on pull requests, pushes to `main`, and manual dispatches.

## Database-backed integration tests

The test suite includes database-backed QR and request-constraint tests. They are intentionally skipped when no Supabase credentials are present, allowing the deterministic unit suite to run safely in every contributor environment.

To run the complete suite, use an **isolated non-production Supabase project** and provide the following environment variables:

```sh
SUPABASE_URL=<test-project-url>
SUPABASE_PUBLISHABLE_KEY=<test-project-publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<test-project-service-role-key>
```

Apply all migrations in `supabase/migrations/` to the test project before running the tests. The guarded runner starts a local app on port 8080, waits for it to become ready, executes the database-backed suites, and shuts the app down afterwards.

```sh
npm run test:integration
```

The GitHub Actions workflow enables this job automatically when the following repository secrets are configured for an **isolated non-production** Supabase project:

```text
SUPABASE_TEST_URL
SUPABASE_TEST_PUBLISHABLE_KEY
SUPABASE_TEST_SERVICE_ROLE_KEY
```

Without these secrets, CI completes the deterministic checks and emits a notice that database integration coverage is inactive. Never add production Supabase credentials to local files, commits, repository secrets intended for testing, or CI logs.
