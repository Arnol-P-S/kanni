# Kanni | കണ്ണി

Kanni is a teacher-first learning platform for Classes 6 to 9. A teacher starts
with curriculum the school is allowed to use. A learner then predicts, makes,
critiques, revises, explains, and reflects. The teacher reads that evidence and
decides how much support should come next. A parent receives one reviewed home
activity without receiving the learner's private draft.

The core idea is simple: AI can prepare support, but it must not do the learner's
thinking or make the teacher's decision.

## What is working

### School administrator

- creates teacher, student, and parent accounts
- maps each learner to an assigned teacher and parent
- adds, versions, archives, and restores permission-safe curriculum packs
- sees studio handoff status and aggregate AI usage
- cannot read raw learner submissions

### Teacher

- creates a learning studio for an assigned learner
- selects an active school curriculum pack or registers a permission-safe source
- receives a complete teacher-owned starting plan without calling AI
- can request one GPT-5.6 planning draft through OpenRouter
- reviews and edits success criteria, lesson sequence, differentiation,
  misconception probes, quick checks, interest routes, maker paths, Socratic
  prompts, reflection prompts, and the family activity
- publishes only after confirming a source review
- reads the learner's full thinking sequence and chooses the next scaffold level

### Learner

- chooses an interest route and what to make
- predicts before beginning
- creates a first version before opening support
- can request one curriculum-grounded set of creative questions and small actions
  after making that first version
- finds a weakness, revises the work, and explains why the revision is stronger
- reflects on what can be done with less help next time
- receives the teacher's next question and future scaffold decision

### Parent

- sees the learning goal, one teacher observation, and one reviewed activity
- sends a small response back to the teacher
- never receives the learner's prediction, draft, critique, revision, model text,
  score, rank, or diagnosis

## The connected learning loop

```text
Administrator approves a versioned, permission-safe curriculum pack
    -> teacher selects the pack and defines the learning goal
    -> teacher reviews a local plan or requests one grounded GPT-5.6 draft
    -> learner predicts and makes before optionally requesting grounded thinking help
    -> learner critiques, revises, explains, and reflects
    -> teacher reviews the evidence and selects guided, light, or independent support
    -> parent receives one reviewed activity and responds
    -> the teacher's scaffold decision becomes the next studio's starting level
```

Every handoff checks the persisted stage and record version. Repeated or stale
actions cannot skip a stage.

![Kanni learner-agency loop](docs/diagrams/render/agency-loop.png)

## Why the AI is bounded

Kanni does not use a general student chatbot. It has two separate, explicit, and
one-use provider calls per studio: a teacher planning draft and a student thinking
coach after a first attempt.

When a teacher presses the AI planning button, Kanni:

1. retrieves up to six sections from the curriculum pack stored for that studio;
2. sends the goal, driving question, class, and retrieved sections to GPT-5.6;
3. requires a strict Zod object with the complete teacher-plan structure;
4. rejects the entire draft if any cited section ID was not retrieved;
5. stores request status, token counts, latency, model, prompt version, and cost,
   but not the provider prompt or learner work;
6. leaves publishing to the teacher.

When a student presses the thinking-coach button, Kanni:

1. requires a first attempt of at least 60 characters;
2. screens the attempt for personal data, high-risk text, and prompt injection;
3. retrieves at most four relevant sections;
4. sends only the goal, driving question, class, first attempt, and those sections;
5. requires three or four question-and-action steps plus a self-check;
6. rejects unknown citations, unsafe text, malformed output, and anything outside
   the strict object before the student sees it.

There is no automatic request, retry, provider fallback, web search, tool use, or
model conversation history. Kanni never asks GPT-5.6 to produce a completed
student answer. It does not add account names, family notes, passwords, membership
records, or the learner's later critique, revision, explanation, and reflection.

The local plan remains usable when AI is off, rejected, over budget, or unavailable.

## Clean Docker test build

The judge deployment starts with an empty PostgreSQL database. It does not create
sample schools, hidden accounts, passwords, or learner records.

After the `build-week-submission` release tag is published:

```bash
docker compose -f compose.judge.yaml up -d --wait
```

Open <http://localhost:3001>. The first screen asks you to create the school and
administrator. Use the administrator workspace to create the other three roles
and connect the support circle. AI is off in this portable build, so it cannot
spend provider credit.

Stop it with:

```bash
docker compose -f compose.judge.yaml down
```

Add `-v` only when you intentionally want to delete the local judge database and
repeat first-run setup.

No public hosting is required for this Education-category submission. The source
repository and this Docker path give judges a complete local test route.

## Local development

Requirements:

- Node 24, using the version in `.nvmrc`
- pnpm 11 through Corepack
- Docker with Compose

```bash
nvm install
nvm use
corepack enable
corepack pnpm install --frozen-lockfile
cp .env.example .env
docker compose up -d --wait db
corepack pnpm db:migrate:deploy
corepack pnpm dev
```

Open <http://localhost:3000>. Kanni redirects an empty installation to `/setup`.
There is no seed command. Create accounts through the administrator workspace.

## Production-style Docker deployment

Create deployment-specific settings first:

```bash
cp .env.production.example .env.production
corepack pnpm env:production:check
./deploy.sh deploy
```

The production Compose stack builds separate migration and application targets,
runs migrations before the application starts, keeps PostgreSQL on an internal
network, drops container capabilities, uses read-only application filesystems,
and exposes the app on `APP_HOST:APP_PORT`. The post-build release check removes
local environment files and stale development cache from the standalone artifact;
Docker injects runtime configuration through Compose instead.

Useful commands:

```bash
./deploy.sh status
./deploy.sh logs app
./deploy.sh backup
./deploy.sh stop
```

Kanni does not configure TLS or an ingress rate limit. Put a TLS reverse proxy in
front of any shared deployment and keep AI disabled until the external request
and spend controls are in place. Complete first-run setup while the application is
still bound to loopback, before making the reverse proxy public.

## Optional OpenRouter configuration

Codex credits pay for work done in Codex. They cannot pay for OpenRouter or OpenAI
API traffic. Runtime model calls need a separate OpenRouter balance.

Set these only after creating a provider key, a hard spend limit, and an ingress
rate limit:

```dotenv
GROWTH_AI_PROVIDER=openrouter
GROWTH_AI_MODEL=openai/gpt-5.6-luna
OPENROUTER_API_KEY=your_provider_key
GROWTH_AI_ENABLED=true
GROWTH_AI_RATE_LIMIT_CONFIRMED=true
GROWTH_AI_SPEND_LIMIT_CONFIRMED=true
# Keep student AI off until the school has reviewed external student-data processing.
GROWTH_AI_STUDENT_HELP_ENABLED=false
GROWTH_AI_STUDENT_DATA_REVIEW_CONFIRMED=false
```

Allowed models are `openai/gpt-5.6-luna` and `openai/gpt-5.6-sol`. Luna is the
default for the bounded structured tasks. Each studio can claim one teacher plan
request. Student thinking-coach requests remain unavailable unless both separate
student flags are set to `true` after the school reviews provider data handling.
Each request also requires an adult to confirm that they are testing the feature
themselves or supervising the activity. The app sets `store: false`, excludes
providers that collect request data, disables provider fallback, and uses low
reasoning. Teacher output is capped at 3,200 tokens with a 40-second timeout;
student help is capped at 900 tokens with a 20-second timeout. Provider-reported
cost is recorded when available. Both allowed models are restricted to OpenRouter's OpenAI route because
that endpoint advertises every structured-output parameter used by Kanni. Current
GPT-5.6 endpoints return no route when Zero Data Retention is required, so Kanni
makes no ZDR claim. The request excludes account names, learner work, family notes,
and earlier model conversations. These technical controls do not replace the
school's legal and child-safety review before any real-student use.

Do not run the live evaluation casually. It makes one paid request and requires an
explicit confirmation value:

```bash
RUN_LIVE_AI_EVALS=I_UNDERSTAND_THIS_SPENDS_OPENROUTER_CREDIT corepack pnpm eval:live
```

## Prepare the saved recording flow

The video can use one complete, read-only learning flow instead of spending time
typing on camera. Start the production Docker stack, keep the four existing role
accounts and their teacher-parent mapping, then run:

```bash
KANNI_RECORDING_FLOW_CONFIRMATION=I_UNDERSTAND_THIS_CREATES_ONE_SYNTHETIC_RECORDING_FLOW \
  docker compose -f compose.recording.yaml --env-file .env.production run --rm --build prepare
```

On a successful run, this command makes exactly two paid requests through the
configured OpenRouter model: one teacher plan and one student thinking-coach
response. Both results must pass the same schemas, source checks, and safety checks
as the application before the database is changed. The command then creates
`Rainwater Resilience Lab` with
original Kanni curriculum and clearly synthetic learner work. On a repeat run, it
replaces only an earlier studio carrying Kanni's recording-flow audit tag. A normal
studio with the same title is left untouched. It does not reset accounts, mappings,
passwords, or other studios. The one-off container enables student AI only for this
fixed synthetic request; it does not change the production application's
student-AI settings.

The completed studio stores the returned model, prompt versions, source IDs, token
counts, latency, and provider-reported cost. It contains the full handoff from
administrator to teacher, learner, teacher review, and parent response, so each
role can be recorded without creating content during the video.

The first recording run also exposed a useful failure case: a schema-valid Luna
response padded seven text fields with malformed glyphs at their maximum lengths.
Kanni now rejects replacement characters, unexpected writing systems, invisible
format controls, and text that reaches a declared output boundary. The saved flow
keeps the real grounded plan and student questions, while a no-egress review task
applies seven documented wording corrections and records a human-review audit
event. That correction task has no provider key and makes zero AI requests.

## Verification

Start the local database, then run:

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm typecheck:compat
corepack pnpm test
corepack pnpm eval
corepack pnpm build
corepack pnpm test:e2e
corepack pnpm audit --audit-level=moderate
```

The Playwright suite resets only the isolated `kanni_test` database. It applies
all migrations and creates the school, users, mappings, curriculum, studio,
submission, teacher review, and family response through the real interface. It
also checks role denial, generic login errors, English and Malayalam switching,
360-pixel layout, reduced motion, parent and administrator privacy, and serious
or critical Axe findings. AI is disabled in the browser suite.

The unit suite has 61 tests. The deterministic evaluation set has 51 cases covering curriculum rights,
retrieval, invented citations, learner agency, scaffold fading, unsupported
requests, prompt injection, personal data, safety routing, role privacy, and
Malayalam-English input. Live model evaluation is separate so ordinary tests do
not spend money.

## Security and privacy boundaries

- bcrypt password hashes and opaque, hashed server sessions
- HttpOnly, SameSite cookies, with Secure cookies in production
- school, role, and relationship checks on every read and write
- login throttling keyed by HMAC hashes
- Zod validation at form, AI, and environment boundaries
- no raw prompt or learner-text logging
- no analytics in this release
- no grading, ranking, diagnosis, stream selection, or career recommendation
- reviewed static safety routing for high-risk English and Malayalam text
- no SCERT textbook copying, screenshots, diagrams, questions, or logos

Read [SECURITY.md](SECURITY.md), [Privacy](app/privacy/page.tsx), and
[Terms](app/terms/page.tsx) before using real school data. Kanni is an independent
OpenAI Build Week project. It is not affiliated with or endorsed by SCERT Kerala
or the Government of Kerala.

## System structure

```text
app/                      Next.js routes, server actions, and role workspaces
components/               accessible forms and learning-studio interfaces
lib/curriculum/           source rights, normalization, sections, retrieval, citations
lib/studio/               schemas, local plan, grounding, and workflow transitions
lib/ai/                   versioned prompt contexts, capability policy, and GPT-5.6 adapter
lib/safety/               personal-data, high-risk, and prompt-injection screens
prisma/                   schema and forward-only migrations
eval/                     deterministic cases and published results
tests/unit/               domain and boundary tests
tests/e2e/                clean-install four-role browser flow
docs/                     system design and rendered architecture diagrams
submission/               Devpost copy, video script, captions, and reviewer notes
```

PostgreSQL is the source of truth. React state is used only for form steps. AI is
an optional adapter behind validated domain contracts, not the owner of workflow
state.

![Kanni system architecture](docs/diagrams/render/system-architecture.png)

## How Codex contributed

This repository was built through one primary Codex thread. Codex helped inspect
and replace an early static lesson prototype, define the learning-studio state
machine, write the Prisma migration, implement clean setup and role mapping,
create the RAG and AI validation boundaries, build each role workspace, and write
the unit, evaluation, and browser suites.

Human decisions set the product direction and limits. In particular:

| Problem | Codex contribution | Human decision | Result |
| --- | --- | --- | --- |
| The first build felt like a static lesson | Traced hardcoded content and replaced the domain and screens | Make teachers the main lever and learner agency the outcome | A reusable curriculum-grounded studio |
| A generic tutor could answer for the learner | Added the first-attempt gate, bounded thinking-coach schema, and predict, make, critique, revise, explain, reflect contract | AI may ask and scaffold, but it may not complete student work | The student owns the evidence |
| School AI can hallucinate | Added local sections, retrieval, strict objects, and citation rejection | Discard unknown source IDs and require teacher review | Provider text cannot publish itself |
| Sample accounts made the deployment feel fake | Added transactional first-run setup and admin provisioning | Production must begin empty | No seed data or displayed credentials |
| Privacy differed by role | Added relation-scoped queries and E2E privacy assertions | Parents and administrators do not receive raw work | The handoff carries only what each role needs |
| A browser check exposed setup failure | Isolated a Prisma adapter error around an advisory lock | Keep the lock and fix the correct boundary | Clean setup works without weakening concurrency control |

GPT-5.6 is integrated as the optional teacher planning model through OpenRouter.
Deterministic and browser verification do not call it. The final README and
submission should report a live model result only after the explicit paid live
evaluation has actually been run.

## Current limits

- one school per installation
- Classes 6 to 9 in the current interface
- one assigned teacher and parent used for each studio handoff
- school-provided text sources, with deterministic section retrieval instead of
  a vector database
- no SSO, MFA, password recovery, account suspension interface, file upload,
  speech input, analytics, or notification service yet
- fixed Malayalam copy still needs a native-speaker release review
- real-child testing is outside the Build Week scope

These are release boundaries, not claims of statewide readiness or learning
effectiveness.

## Licenses

Code is MIT licensed in [LICENSE](LICENSE). Original Kanni teaching prompts,
planning templates, interface copy, safety cards, and evaluation cases are CC BY
4.0 under [CONTENT-LICENSE.md](CONTENT-LICENSE.md). A school remains responsible
for the rights and retention policy of any curriculum it enters.
