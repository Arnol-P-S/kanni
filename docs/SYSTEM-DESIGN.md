# Kanni system design

## 1. Outcome

Kanni connects one learning goal across a school administrator, assigned teacher, enrolled student, and linked parent. It is designed around a complete learning-support cycle, not four disconnected dashboards.

```text
teacher plans
  -> student attempts, uses support, revises, and explains
  -> teacher reviews evidence and chooses the next support
  -> parent receives one reviewed home activity and responds
  -> student sees the teacher-selected next activity
```

PostgreSQL is the source of truth. Users sign in with separate accounts. Every read and write is scoped by both school membership and the relevant relationship.

## 2. Current boundaries

The current release contains:

- one school-ready tenant model
- four roles: school administrator, teacher, student, and parent
- password authentication and revocable opaque sessions
- teacher-student and parent-student relationships
- one persisted fractions learning cycle
- teacher planning and differentiation
- fixed-choice student evidence and record challenge
- teacher review and next-support selection
- filtered family handoff and bounded family response
- persistent English or Malayalam preference
- optional, non-authoritative GPT-5.6 drafting through OpenRouter
- development and production Docker Compose topologies

The next operational slice is administrator-driven account provisioning and relationship editing. Multi-membership selection, password recovery, MFA, SSO, retention automation, notifications, and analytics are integration points, not hidden behavior.

## 3. Runtime topology

```text
Browser
  | HTTPS at deployment ingress
  v
Next.js application container
  | Prisma 7 PostgreSQL adapter
  v
PostgreSQL 18

Next.js server only, optional
  |
  v
OpenRouter -> allowlisted GPT-5.6 route
```

The production Compose file keeps PostgreSQL on an internal network. A one-shot migrator applies committed schema migrations before the non-root application container becomes healthy. The application container is read-only, drops Linux capabilities, and uses a small temporary filesystem.

The public deployment must add a managed ingress or reverse proxy for TLS, request-size limits, malformed-request handling, and traffic rate limiting.

## 4. Data model

### Identity and tenancy

- `School`: tenant boundary and local context
- `User`: login identity, bcrypt password hash, locale, active flag
- `Membership`: user role inside one school
- `Session`: hashed opaque token bound to one user and membership
- `LoginThrottle`: HMAC-derived failure key and reset window
- `AuditEvent`: school-scoped security and workflow event

### Relationships

- `TeacherStudent`: an explicit assigned teacher and enrolled student link
- `GuardianStudent`: an explicit parent and student link

These relations are independent of role labels. A teacher or parent can access a learning cycle only when the cycle references their membership.

### Learning cycle

`LearningCycle` holds the learning goal, reviewed content, selected strategy, fixed-choice evidence, teacher review, family approval and response, timestamps, and an incrementing version.

The state sequence is:

```text
draft
  -> active
  -> waiting_teacher_review
  -> waiting_family
  -> complete

non-draft cycle -> archived + a new draft when an administrator reopens the goal
```

Writes repeat the expected status and membership in the SQL predicate. This prevents a stale browser action from silently moving the cycle after another role has already advanced it. Archived cycles remain available as school history and are excluded from the current-work query.

## 5. Authentication

1. A Server Action validates the email and password with Zod.
2. The server checks HMAC-keyed throttle state.
3. The password is compared against bcrypt. Unknown users use a fixed dummy hash.
4. Exactly one active membership is required in this release.
5. The server creates a 256-bit random token and stores only its SHA-256 hash.
6. The browser receives an HttpOnly, SameSite=Lax cookie that is Secure in production.
7. Every protected request resolves the session, user, membership, school, active state, and expiry from PostgreSQL.
8. Logout deletes the database session and clears the cookie.

Proxy only redirects requests that have no session cookie. It cannot prove that a cookie is valid and is never used as the authorization boundary.

## 6. Authorization and information visibility

| Role | Scope | Can change | Cannot see or change |
|---|---|---|---|
| School administrator | current school | preserve the current cycle and open the goal again | student evidence and teacher review decisions |
| Teacher | assigned cycles | plan, publish, review, choose next support, approve family activity | unrelated students and other schools |
| Student | enrolled cycles | answer, open support, revise, explain, challenge own record | teacher controls, family response, other students |
| Parent | explicitly linked cycles | one bounded family response | raw student evidence, model output, private teacher work |

Authorization has three layers:

1. Server session resolves the actor and active membership.
2. Data Access Layer adds school and relationship scope to reads.
3. Every Server Action repeats the exact role, relationship, and state preconditions at the write.

Client controls, hidden buttons, route names, and Proxy redirects are not treated as security controls.

## 7. Design patterns used with purpose

Patterns are used only where they make the learning system easier to extend and test.

### Data Access Layer

`lib/school-data.ts` owns relationship-scoped queries. UI components receive already-scoped records and do not assemble authorization filters.

### Policy Object

`lib/permissions.ts` makes role capabilities and information visibility explicit. `lib/ai/capability-policy.ts` separately expresses release gates for the provider. Both are deterministic and evaluated without infrastructure.

### State Machine

Cycle status, required fields, and database predicates define valid handoffs. Server Actions act as transition commands. Invalid or repeated transitions fail closed or remain idempotent.

### Strategy

The teacher chooses `fraction_strips`, `guided_questions`, or `explain_to_someone`. `growth-support-presentations.ts` maps each choice to reviewed student and parent presentations. Adding a new support requires an enum migration, reviewed content, presentation mapping, and tests.

### Adapter

`lib/ai/growth-ai.ts` is the provider adapter. The domain workflow consumes a teacher-plan or student-support draft and remains unchanged when AI is unavailable. A future provider can implement the same validated boundary.

### Unit of Work

Prisma transactions group security-sensitive multi-record operations with audit events. Examples include session creation, plan publication, evidence submission, record challenge, teacher review, family response, cycle archival and creation, and logout.

### Presentation Model

Parents receive a deliberately reduced view of the learning cycle. The parent page does not render a generic cycle object or model transcript. It derives one reviewed summary and home action from trusted fields.

Patterns deliberately not used:

- no global singleton state store in the browser
- no event bus for a single-process, synchronous workflow
- no recursive agent graph
- no repository abstraction over every Prisma call
- no microservices before there is an independent scaling or ownership need

## 8. Optional AI

AI is an enhancement to reviewed content, not the product's control plane.

Teacher-plan request:

```text
teacher requests draft
  -> server checks feature, provider, model, credential, and release gates
  -> exact bundled context is sent
  -> schema-validated plan returns
  -> teacher reviews and decides whether to publish
```

Student support request:

```text
student opens support already selected by teacher
  -> exact strategy and bundled fractions context are sent
  -> schema validation
  -> allowlisted source IDs
  -> deterministic content and strategy checks
  -> accepted draft or immediate reviewed fallback
```

No AI request contains learner identity, email, answer record, family response, session, or membership. AI cannot decide access, publish content, grade, rank, diagnose, contact a family, or mutate the database directly.

## 9. Language model

English and Malayalam interface strings are fixed code dictionaries. Locale is stored on the user and mirrored to an HttpOnly cookie so public and authenticated pages render consistently. The language action validates the locale and accepts only a same-origin relative return path.

Malayalam passages use `lang="ml"`, local Noto Sans Malayalam fonts, and no artificial letter spacing. A native Malayalam educator review remains a release gate for real school use.

## 10. Failure behavior

| Failure | Behavior |
|---|---|
| PostgreSQL unavailable | health endpoint returns 503; account and workflow operations stop without inventing state |
| invalid or expired session | redirect to sign-in; no protected data returned |
| wrong role | redirect to the actor's own portal; mutation is not executed |
| unrelated membership | scoped query finds no cycle; mutation is not executed |
| stale workflow action | database transition predicate updates zero rows; safe notice returned |
| provider disabled or missing key | reviewed content remains available |
| provider timeout or error | reviewed content is returned |
| malformed or unsafe AI output | generated text is hidden and reviewed content is returned |
| duplicate action | one-shot precondition or idempotent transition prevents double mutation |

## 11. Deployment evolution

### Current complete slice

- one Next.js process
- one PostgreSQL instance
- one school and one learning goal seeded for judging
- opaque database sessions
- Docker Compose deployment
- optional AI provider

### School integration

- administrator provisioning and relationship approval
- school SSO or reviewed identity provider
- MFA for staff and school administrators
- password reset and session-management screens
- retention, export, correction, and deletion workflows
- notification outbox and consent-aware delivery
- backup schedule, restore tests, monitoring, and incident playbooks

### Multi-school scale

- membership selection for users in multiple schools
- database row-level-security defense in depth
- immutable tenant-aware audit export
- queued notifications and background tasks
- shared cache and a stable Server Action encryption key for multiple app replicas
- deployment ID and controlled rolling releases
- per-school feature, budget, and provider policy

Microservices should be introduced only when notification delivery, identity, analytics, or AI execution has a clear independent scale, security, or ownership boundary.

## 12. Verification model

The release evidence combines:

- unit tests for state transitions, role policy, AI release policy, schemas, and deterministic output gates
- 32 deterministic cases covering authorization, workflow, language, privacy, and AI configuration
- database-backed Playwright tests for the full four-account cycle and denied access
- Axe scans on landing and sign-in pages
- mobile language switching at 360 pixels
- dependency audit, production build, Docker configuration validation, and image build
- separate read-only security and implementation self-review

This evidence demonstrates that the implemented workflow behaves as designed. It does not claim learning effectiveness or legal readiness for every school.
