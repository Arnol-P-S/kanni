# Kanni security model

Kanni handles school accounts, curriculum sources, learner work, teacher reviews,
and family responses. This file describes the controls in the current code and
the work still required before a school uses real student data.

Report a suspected vulnerability privately to the repository owner. Do not put
credentials, learner records, or exploit details in a public issue.

## Protected assets

- account credentials and server sessions
- school membership and responsibility mappings
- curriculum entered by a school
- learner predictions, drafts, critiques, revisions, explanations, and reflections
- teacher observations and feedback
- family activities, responses, and notes
- OpenRouter credentials and AI usage records
- audit history

## Trust boundaries

```text
Browser
  -> Next.js server actions and server-rendered role pages
  -> PostgreSQL

Teacher planning action only
  -> retrieved curriculum sections
  -> OpenRouter
  -> allowlisted GPT-5.6 model
  -> strict object and citation checks
  -> teacher review
```

The browser never receives the database password, authentication secret,
OpenRouter key, or prompt construction code. PostgreSQL is the workflow source of
truth. The model cannot change workflow state directly.

## Authentication

- passwords are hashed with bcrypt at cost 12
- session tokens contain 256 bits of random data
- PostgreSQL stores only the SHA-256 token hash
- session cookies are HttpOnly and SameSite=Lax
- production cookies are Secure
- sessions expire after the configured server lifetime
- logout deletes the server record before clearing the cookie
- failed-login counters use HMAC-hashed email and network keys
- responses use one generic invalid-credentials message
- forwarded client addresses are read only when `AUTH_TRUST_PROXY=true`

First-run setup is protected by a PostgreSQL transaction advisory lock and a
serializable transaction. Only an empty installation can create the first school
administrator. No default account or password exists.

Complete first-run setup from the loopback-bound application before exposing a
reverse proxy. On an empty installation, the first person who can reach `/setup`
can create the administrator account.

## Authorization and privacy

Every protected route calls `requireActor` for one exact role. Every mutation
checks the school and relationship again at the database boundary.

- administrators can manage school accounts and mappings, but their queries do
  not select raw learner submissions
- teachers can access studios only for assigned learners in their school
- students can access only their own active studio and submission
- parents can access only a reviewed handoff for an assigned learner
- parent queries do not select the learner's raw submission or model output
- AI usage shown to administrators is aggregate metadata

The Playwright release test places a unique sentence in a learner revision and
asserts that it is absent from both parent and administrator pages.

## Workflow integrity

`LearningStudio.status` is a persisted state machine:

```text
planning
  -> ready_for_student
  -> awaiting_teacher_review
  -> ready_for_family
  -> complete
```

Mutations use the expected status and current version in their database updates.
A stale, repeated, or wrong-role action cannot silently advance the record.
Publishing requires a teacher source-review confirmation and a complete support
circle. Family access begins only after the teacher has reviewed the learner's
evidence.

## Input controls

Zod schemas validate setup, login, account creation, mappings, curriculum packs,
teacher plans, learner submissions, reviews, family responses, AI output, and
production environment settings.

User-entered learning text is checked after Unicode NFC normalization for:

- phone-like values, email addresses, web links, and social handles
- high-risk English and Malayalam phrases
- prompt-injection and source-override phrases before any AI-bound request
- diagnostic wording in teacher observations
- size and structure limits

Optional source links accept only HTTP or HTTPS schemes. AI-bound text is escaped
before it is placed inside prompt markup, so user text cannot close the declared
curriculum or lesson tags.

High-risk learner or family text is not saved. The interface shows a reviewed
static card with 112, Childline 1098, and Tele-MANAS 14416. GPT-5.6 does not write
crisis advice.

React renders entered text as text content. Kanni does not use raw HTML rendering
for curriculum or learning records. Prisma parameterizes database operations.

## AI and RAG controls

AI is disabled by default. It becomes available only when all required provider,
model, key, rate-limit, and spend-limit settings pass the capability policy.
Student help has two additional release controls: a separate feature flag and an
operator confirmation that external student-data processing has been reviewed.

The current provider path has these limits:

- a teacher or student must press the relevant AI button
- each student-help request requires an adult to confirm that they are testing the
  feature themselves or supervising the activity
- one teacher plan and one student thinking-coach request can be claimed per studio
- only `openai/gpt-5.6-luna` and `openai/gpt-5.6-sol` are allowed
- teacher planning sends only the goal, driving question, class, and up to six
  retrieved curriculum sections
- student help requires a first attempt and sends only that attempt, the lesson
  fields, and up to four retrieved curriculum sections
- Kanni does not add account names, family notes, sessions, later submission
  fields, or prior model conversations to either request
- `store: false` is requested
- providers that collect request data are excluded with `data_collection: "deny"`
- the request is restricted to the OpenAI route, with no provider fallback
- provider fallback, model retry, web search, and external tools are disabled
- teacher output is limited to a strict plan object and 3,200 tokens with a
  40-second timeout
- student output is limited to a strict question-and-action object and 900 tokens
  with a 20-second timeout
- a deterministic agency gate rejects answer-revealing language and any creative
  step that is not phrased as a question
- every nested citation must match a retrieved local section ID
- one invalid citation discards the whole generated plan
- generated contact details, high-risk text, and diagnostic labels discard the
  whole generated plan
- provider failure keeps the local teacher-owned plan or reviewed static student
  prompts
- the teacher must review and publish the result

OpenRouter and the selected model provider remain external processors. A school
must review their current terms, retention behavior, regional routing, and child
data requirements before enabling AI for real use. Current GPT-5.6 routes return
no endpoint when Zero Data Retention is required, so Kanni makes no ZDR claim.
Teacher planning excludes learner work. Student help sends the bounded first
attempt only after an explicit, adult-confirmed request and after the operator has
enabled the separate student controls. External safety-monitoring retention may
still apply. These controls are safeguards for an adult-operated prototype, not a
claim that the system is ready for unsupervised use by children.

Teacher-written goals and curriculum remain part of the request. Teachers must
keep names and other identifying details out of those fields.

## Curriculum rights

Kanni accepts only original, CC BY 4.0, public-domain, or written-permission text.
The teacher must confirm the right to copy it. Known SCERT hosts are forced to
link-only treatment. The repository does not include SCERT textbook text, images,
diagrams, questions, PDFs, or logos.

Rights validation is a technical guard, not legal advice. The school remains
responsible for the source and any required attribution.

## Container and deployment controls

- Git and the Docker build context exclude local environment files
- the production build removes copied environment files and stale development
  cache from the standalone artifact before it can be packaged
- provider credentials are injected at runtime and are not present in the
  standalone application bundle
- separate production application and migration image targets
- pinned PostgreSQL image digest
- PostgreSQL on an internal Compose network
- application and migration containers drop all Linux capabilities
- `no-new-privileges` enabled
- read-only application and migration filesystems
- bounded temporary filesystems
- health checks for PostgreSQL and the application
- application bind address defaults to `127.0.0.1`
- environment validation rejects placeholder production secrets
- database backups use `pg_dump` without embedding credentials in the archive name

TLS, a reverse proxy, host firewall policy, external rate limiting, secret
management, monitoring, encrypted backups, and recovery testing belong to the
deployment operator. The Compose file does not claim to provide them.

## Logging

Audit records contain actor, school, action, entity type, entity ID, time, and
small non-sensitive metadata. They do not contain passwords, session tokens,
provider keys, curriculum bodies, learner text, family notes, or provider prompts.
Provider failures log only a bounded error category.

There is no analytics package in this release.

## Known gaps before real school use

| Priority | Required work |
| --- | --- |
| High | Add password recovery, administrator account suspension, session revocation controls, and MFA or school SSO. |
| High | Define school-specific retention, export, correction, and deletion workflows. |
| High | Complete a legal and child-safety review for the deployment region and configured providers. |
| High | Add an ingress rate limit before enabling AI on a shared address. |
| High | Put TLS and managed secrets in front of the production container. |
| Medium | Add security event monitoring, alerting, backup restore drills, and incident procedures. |
| Medium | Add administrator review for mapping changes and privileged actions. |
| Medium | Add dependency and container scanning to the release record. |
| Medium | Arrange an independent penetration test before handling real student data. |

Do not treat this Build Week release as school production approval. It is a
working, locally testable system with explicit boundaries and a documented path
to stronger operational controls.
