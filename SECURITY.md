# Kanni security model

## Scope

This document covers the current Kanni web application, PostgreSQL data model, password and session flow, role and relationship authorization, learning-cycle mutations, optional OpenRouter integration, and Docker deployment.

The code is built for a controlled school review, but a school must complete its legal, privacy, identity, backup, monitoring, and incident-response work before processing real student data.

## Assets and boundaries

Kanni protects:

- password hashes and server-side sessions
- school, user, membership, teacher-student, and parent-student records
- student learning evidence and teacher review
- parent-facing activity and bounded response
- provider credentials and deployment secrets
- audit-event integrity

The browser is untrusted. The HttpOnly cookie contains only a random opaque session token. The database stores its SHA-256 hash, membership binding, expiry, and last-seen time. Every portal page and every mutation resolves the actor again on the server.

PostgreSQL is on an internal Docker network in the production topology. The application is the only public service. TLS and edge traffic controls belong at the deployment ingress.

## Authentication and sessions

- Emails are normalized and inputs are validated with Zod.
- Passwords are hashed with bcrypt at cost 12.
- A fixed dummy bcrypt hash reduces account-enumeration timing differences.
- Invalid credentials return a generic message.
- Login attempts are throttled by a server-secret HMAC of the account email and, when a trusted ingress is configured, the client network key.
- Session tokens contain 256 bits of randomness and are stored only as SHA-256 hashes.
- Session cookies are HttpOnly, SameSite=Lax, Secure in production, path-scoped to `/`, and expire after eight hours.
- Expired sessions are rejected. Logout deletes the database session before clearing the cookie.
- Disabled users, inactive memberships, mismatched user-membership pairs, and accounts with an ambiguous active membership are rejected.

Local review credentials are committed for reproducible judging. They are used only when `KANNI_SEED_LOCAL_ACCOUNTS=true` and must never be enabled for a real school environment. Production review-account display is off by default.

## Authorization and privacy boundaries

Proxy performs only an optimistic cookie-presence redirect. It is not trusted for authorization.

The server Data Access Layer always combines the authenticated school ID with the role relationship:

| Role | Database scope | Allowed workflow |
|---|---|---|
| School administrator | current school | see accounts, mappings, and cycle handoff; preserve the current cycle and open the goal again |
| Teacher | assigned teacher membership | plan, publish, review evidence, approve family activity |
| Student | enrolled student membership | answer, open selected support, revise, explain, challenge the record |
| Parent | linked guardian membership | see approved family handoff and return a bounded response |

The administrator and parent portals do not expose student evidence. The parent never receives a model transcript, private teacher note, rank, diagnosis, or custom student prompt.

Server Actions are directly reachable POST endpoints. Each action therefore validates its own input, authenticates the actor, requires the exact role, loads a relationship-scoped record, and repeats membership and state preconditions in the database write.

## Workflow integrity

The learning cycle is a persisted state machine:

```text
draft -> active -> waiting_teacher_review -> waiting_family -> complete
```

Database `updateMany` preconditions make one-shot handoffs idempotent and reject stale or out-of-order writes. Security-sensitive workflow updates and their audit events commit in the same Prisma transaction. Starting a goal again archives the previous cycle and creates a new record instead of deleting evidence. Audit events record login, logout, plan publication, evidence submission, record challenges, family approval, family response, and new-cycle creation without logging passwords, tokens, provider keys, or free-text student conversations.

## Optional AI boundary

AI is disabled by default and is not required for the learning cycle.

When enabled:

- only `openai/gpt-5.6-sol` through the configured OpenRouter adapter is allowed
- credentials remain server-side
- production also requires explicit spend-limit and rate-limit confirmations
- calls use one approved fractions context and the selected support strategy
- learner identity, email, answer history, family response, session, and school membership are not sent
- output must match a strict Zod object and allowlisted source identifiers
- student support also passes a deterministic content and strategy gate
- retries, recursive agents, tools, web access, and provider fallback are disabled
- database claims limit teacher drafting and student support to one provider request per learning cycle
- timeout, provider error, malformed output, or failed content checks return reviewed project-authored content
- AI output is a draft and cannot publish a plan or change authorization

OpenRouter routing settings request Azure-only, Zero Data Retention-capable processing, deny provider data collection, require parameter support, and disable provider fallback. The operator must still confirm the selected route and current provider policy before release.

## Docker and supply chain

- Package versions and Docker base images are pinned.
- Dependency installation uses the committed pnpm lockfile.
- The production image uses a multi-stage build.
- The runtime container is non-root and read-only, drops all capabilities, enables `no-new-privileges`, and has a bounded temporary filesystem.
- PostgreSQL is not published to the host in the production Compose file.
- Migrations run as a non-root user in a read-only, capability-dropped one-shot container before the app becomes healthy.
- Application and database containers have health checks and resource bounds.
- `.dockerignore` excludes all environment files, Git data, test artifacts, and local build output.
- Secrets come from the private deployment environment, never from the image.
- Deployment commands reject placeholder secrets and unsafe production configuration before Compose starts.

Production still needs a reverse proxy or managed ingress for TLS, malformed-request handling, request-size limits, and edge rate limiting. It also needs image scanning, log aggregation, alerting, scheduled backups, and restore exercises.

The backup helper creates owner-readable files with a restrictive process umask. Operators must still encrypt, retain, test, and remove backups under school policy.

## Data handling

Kanni stores accounts, memberships, relationship mappings, fixed-choice learning evidence, teacher review, family response, locale, sessions, throttling state, and audit events in PostgreSQL.

Kanni does not create public profiles, social feeds, direct student messaging, rankings, ability labels, automated grades, academic-stream decisions, career recommendations, or crisis conversations.

The school remains responsible for lawful basis, notices, guardian or student rights where applicable, retention, deletion, access review, and incident communication. The current code does not yet automate data-retention deletion.

## Remaining risks before a real school launch

| Priority | Remaining work |
|---|---|
| High | Replace local review accounts with school-managed identity, password recovery or SSO, MFA for privileged roles, and an audited account lifecycle. |
| High | Complete local legal and child-privacy review, retention schedules, access requests, deletion, backups, restore tests, and incident response. |
| High | Put the app behind TLS and trusted ingress controls. Configure and verify external rate limiting before enabling AI. |
| Medium | Add administrator provisioning and relationship-change workflows with approval and audit coverage. |
| Medium | Add trusted-proxy configuration for network-aware login throttling and test it against the chosen ingress. |
| Medium | Add centralized security monitoring, session-management screens, forced logout, and suspicious-login alerts. |
| Medium | Obtain native Malayalam educator review of every fixed string and learning-support presentation. |

## Verification expectations

Before release, run lint, both TypeScript compilers, unit tests, deterministic evals, the production build, database-backed Playwright journeys, dependency audit, Docker configuration validation, and an image build. The browser suite must verify wrong-role denial, the complete four-account handoff, mobile language switching, generic login failure, and no serious or critical Axe findings.

## Reporting a vulnerability

Do not open a public issue containing secrets or student information. Send the maintainer a minimal reproduction with the affected version, expected behavior, observed behavior, and impact. Use invented data only. Rotate exposed credentials immediately and preserve audit evidence without copying sensitive payloads into ordinary logs.
