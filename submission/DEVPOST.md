# Kanni | കണ്ണി

## Elevator pitch

Kanni connects a student, teacher, parent, and school around one persistent learning cycle, then turns the teacher's review into the student's next activity.

## The problem

Teachers plan, differentiate, assess, and communicate with families, but these tasks often live in different tools. Students receive answers or scores without a clear next step. Parents want to help but may not know what the teacher observed or what is safe and useful to try at home. School leaders need to know whether the support circle is connected without reading private student evidence.

## The solution

Kanni gives every person a separate account and a role-specific task:

- School administrator: see accounts, assigned relationships, and the current handoff.
- Teacher: review a plan, anticipate misconceptions, choose support, publish, review evidence, and approve a family activity.
- Student: attempt, open the selected support, revise, explain, and challenge an inaccurate record.
- Parent: receive one reviewed summary and home activity, then send one bounded response.

The teacher's reviewed strategy changes the student's next view and the parent's activity. This makes Kanni one connected product, not four dashboards.

## Technical implementation

- Next.js 16, React 19, TypeScript strict mode
- PostgreSQL 18 and Prisma 7
- bcrypt passwords and opaque, revocable database sessions
- school, role, and relationship authorization at every protected boundary
- database state-machine preconditions for one-shot workflow handoffs
- fixed English and Malayalam dictionaries with persistent user locale
- optional GPT-5.6 Sol drafts through a narrow OpenRouter adapter
- Docker Compose development and production topologies
- Vitest, 32 deterministic eval cases, Playwright, and Axe

The production-shaped Compose stack uses a one-shot migration service, an internal database network, health checks, resource bounds, and a non-root read-only application container.

## GPT-5.6

GPT-5.6 Sol can draft a teacher plan or strategy-specific student support from one small, approved context. Output is schema checked, source allowlisted, and content gated. It cannot publish, authorize, grade, rank, diagnose, or contact a family. Reviewed content keeps the workflow complete when AI is disabled or fails.

## Privacy and rights

Parents do not receive raw student evidence, model transcripts, or private teacher work. Administrators do not receive student evidence in the current portal. Kanni has no public profile, feed, rank, direct student messaging, custom student prompt, or automated grading.

All bundled learning content is original Kanni content. Public textbook pages remain references only. Kanni does not copy or redistribute textbook passages, images, questions, PDFs, or logos.

Before a real school rollout, the operator must complete identity lifecycle, privacy approval, retention, backup and restore, monitoring, incident response, and Malayalam educator review.

> Kanni is independent. It is not affiliated with or endorsed by SCERT Kerala or the Government of Kerala.
