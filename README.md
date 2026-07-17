# Kanni | കണ്ണി

Kanni is a connected learning-support platform for schools. It gives students, teachers, parents, and school administrators separate accounts and a shared learning cycle with role-appropriate information.

One teacher decision changes what the student sees next. The student chooses a maker path, creates a first design, critiques it, and revises it. The assigned teacher reviews that work and decides how much scaffold comes next. The parent receives only a safe summary and teacher-reviewed home activity. The school administrator sees accounts, relationships, handoff state, and scaffold policy without receiving the student's raw work.

## The complete slice

The current release implements one complete school workflow around an original fractions learning goal:

1. The school administrator sees the active accounts and teacher-student-parent relationships.
2. The assigned teacher reviews the learning plan, anticipates likely misconceptions, chooses a support strategy, and publishes the activity.
3. The assigned student makes a first choice, opens the teacher-selected scaffold, chooses what to make, creates a first design, critiques it, and revises it.
4. The teacher reviews the artifact and mathematics evidence, chooses the next support and scaffold level, and approves a family activity.
5. The linked parent sees the kind of artifact created and the approved home activity, but not the raw artifact text, then returns a bounded response.
6. The student's next view reflects the teacher's reviewed support. A new cycle inherits the guided, light, or independent scaffold level chosen by the teacher.

When a school leader opens the goal again, Kanni archives the previous cycle and creates a new draft. Earlier evidence is preserved instead of reset in place.

The application uses real database persistence, password authentication, revocable server sessions, role and relationship authorization, English and Malayalam preferences, audit events, and Docker deployment. It does not depend on AI to complete the workflow.

## Technology

- Node.js 24.18.0 and pnpm 11
- Next.js 16.2.10, React 19.2.7, and TypeScript strict mode
- PostgreSQL 18.4
- Prisma 7.8 with the PostgreSQL driver adapter
- Tailwind CSS 4 and local Noto Sans font packages
- Optional OpenRouter integration through the Vercel AI SDK
- Vitest, Playwright, and Axe
- Docker Compose for development and production-shaped deployment

Versions are pinned in `package.json`, `.nvmrc`, the lockfile, Dockerfile, and Compose files.

## Start locally

Requirements: Docker with Compose, Node 24.18.0, and Corepack.

```bash
cp .env.example .env
docker compose up -d db
corepack pnpm install
corepack pnpm db:migrate:deploy
corepack pnpm db:seed
corepack pnpm dev --hostname 127.0.0.1 --port 3001
```

Open `http://localhost:3001`.

The development database listens only on `127.0.0.1:5436`, so it does not conflict with the other PostgreSQL containers on this workstation. The Compose project and volume are also isolated under `kanni-dev`.

### Local review accounts

The seed creates these local accounts only when `KANNI_SEED_LOCAL_ACCOUNTS=true`:

| Role | Email | Local password |
|---|---|---|
| School administrator | `admin@kanni.local` | `Admin@Kanni2026` |
| Teacher | `teacher@kanni.local` | `Teacher@Kanni2026` |
| Student | `student@kanni.local` | `Student@Kanni2026` |
| Parent | `parent@kanni.local` | `Parent@Kanni2026` |

The login page can fill these accounts in development. Production hides them unless `REVIEW_ACCESS_VISIBLE=true`. Do not reuse these credentials for a school deployment.

Stop the local dependency with:

```bash
docker compose down
```

The database volume remains. Use `docker compose down -v` only when you intentionally want to delete local Kanni data.

## Database commands

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:migrate:deploy
pnpm db:seed
pnpm db:studio
```

`pnpm db:migrate` creates development migrations. Deployment uses only committed migrations through `pnpm db:migrate:deploy`.

## Optional AI

Kanni works fully with `GROWTH_AI_ENABLED=false`. Reviewed project-authored plans and supports remain available when no provider is configured, the provider times out, output is malformed, or the deterministic content gate rejects it.

The optional teacher-plan and student-support drafts use the allowlisted `openai/gpt-5.6-luna` model through OpenRouter by default. Luna is the deliberate choice for this bounded structured-output task because it costs less than Sol. Kanni retrieves only relevant sections from the reviewed, original fractions lesson pack, then rejects generated citations that were not retrieved. It does not send a learner name, email, answer record, family response, session, or school membership.

Codex credit cannot pay for application API calls. It pays for development work performed in Codex. OpenRouter needs its own balance. A $10 ceiling is suitable for controlled judging when AI is optional, each learning cycle can claim each AI draft only once, retries and provider fallback are disabled, and an account spend limit plus host rate limit are active. Exact usage still depends on current provider pricing.

To enable AI after those controls exist:

```dotenv
GROWTH_AI_PROVIDER=openrouter
GROWTH_AI_MODEL=openai/gpt-5.6-luna
OPENROUTER_API_KEY=replace-me
GROWTH_AI_ENABLED=true
GROWTH_AI_RATE_LIMIT_CONFIRMED=true
GROWTH_AI_SPEND_LIMIT_CONFIRMED=true
```

Production capability remains closed unless both confirmation flags are true. The key stays server-side.

## Verification

Start the development database before the browser suite. Then run:

```bash
pnpm lint
pnpm typecheck
pnpm typecheck:compat
pnpm test
pnpm eval
pnpm build
pnpm test:e2e
pnpm audit --audit-level=moderate
pnpm diagrams
```

The Playwright suite resets the isolated `kanni_test` database, applies migrations, and seeds review accounts. It covers the complete four-account handoff, wrong-role denial, generic login failure, English-Malayalam switching at 360 pixels, and serious or critical Axe findings.

The 44-case deterministic evaluation covers authorization, workflow transitions, language selection, information visibility, AI release policy, curriculum retrieval, learner-agency guards, artifact completion, and scaffold fading. Results are written to `eval/deterministic-results.json`.

## Architecture

The application follows a few deliberate patterns:

- Data Access Layer: authenticated actor and relationship-scoped queries live in server-only modules.
- State Machine: database status and write preconditions enforce valid learning-cycle handoffs.
- Strategy: teacher support choices and scaffold levels map to reviewed student and family presentations.
- Adapter: the optional AI provider sits behind one server-only boundary and returns schema-checked drafts.
- Unit of Work: multi-record changes and their audit events use Prisma transactions.
- Policy Object: role capabilities, visible information, and AI release gates are explicit and testable.

See [System design](docs/SYSTEM-DESIGN.md) and the rendered diagrams in `docs/diagrams/render/`.

## Docker deployment

Create a private production environment file:

```bash
cp .env.production.example .env.production
```

Replace every database, authentication, and seed password. Then:

```bash
./deploy.sh deploy
./deploy.sh status
./deploy.sh logs app
```

Every deployment command validates `.env.production` first. Placeholder secrets, connection-URL-unsafe database passwords, visible review credentials, non-HTTPS public URLs, and AI without confirmed spend and rate controls are rejected without printing secret values. `openssl rand -hex 32` creates a suitable database password.

The production Compose topology includes:

- a PostgreSQL container on an internal network with a named volume
- a non-root, read-only one-shot migration container
- a non-root, read-only Next.js application container
- dropped Linux capabilities, `no-new-privileges`, resource bounds, and health checks
- a separate opt-in seed profile

The app is exposed on port 3001 by default. Put a reviewed reverse proxy or managed ingress in front of it for TLS, request-size limits, and rate limiting. Configure backups, restore tests, retention, monitoring, password reset or SSO, and school privacy approval before using real student data.

## Privacy and school readiness

Kanni stores only the data needed for the connected learning cycle: school accounts, memberships, assigned relationships, fixed-choice evidence, the student's bounded artifact draft and revision, teacher review, family response, locale, sessions, and audit events.

It does not create public profiles, ranks, feeds, direct student messaging, ability labels, academic-stream decisions, career recommendations, or automated grades. Raw artifact text is visible only to the student and assigned teacher. Parents and administrators receive safe workflow summaries instead.

This repository is production-shaped, not a claim that one codebase alone makes a school deployment legally or operationally ready. A real deployment still needs local policy review, identity lifecycle, password recovery or SSO, data retention, backup and restore, incident response, and approval for processing student data. See [Security](SECURITY.md), `/privacy`, and `/terms`.

## Content rights

The fractions lesson and all Kanni interface content are original project content. Code is licensed under MIT. Original lesson content is separately licensed under CC BY 4.0 in `CONTENT-LICENSE.md`.

Public textbook sites are references only. Kanni does not ingest, copy, index, transcribe, screenshot, redraw, or redistribute textbook passages, images, diagrams, questions, PDFs, or logos.

> Kanni is independent. It is not affiliated with or endorsed by SCERT Kerala or the Government of Kerala.

## Repository map

```text
app/                     Next.js routes and server actions
components/              public, login, and portal components
lib/                     auth, data access, workflow, policy, and AI adapter
prisma/                  schema, migrations, and seed
docker/                  database initialization
eval/                    deterministic release cases and results
tests/unit/              state, policy, and AI boundary tests
tests/e2e/               browser journeys
docs/                    system design and diagrams
submission/              Devpost story, review kit, video script, screenshots
compose.yaml             isolated local PostgreSQL
compose.production.yaml  application, migration, and database topology
```

## Current limitations and next integrations

- The complete slice has one school and one original fractions learning cycle.
- The school admin portal observes seeded accounts and relationships. Full account provisioning and relationship editing are the next school-operations slice.
- Each user currently has one active membership. The schema supports multiple memberships, but account-time school selection is not implemented.
- Password reset, MFA, school SSO, email delivery, backups, monitoring, and automated retention are deployment integrations, not hidden claims.
- Malayalam copy needs final review by a native Malayalam educator before a real school release.
- AI supports plan drafting and curriculum-grounded Socratic questions only. It never receives or writes the student's artifact, and it cannot publish a plan, change authorization, grade a student, or contact a family.

These boundaries preserve a complete, useful learning cycle while keeping the path to school integration explicit.
