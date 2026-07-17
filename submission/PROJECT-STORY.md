# Kanni project story

## Inspiration

Learning support often breaks at the handoffs. A teacher plans a useful activity, but the student's struggle is reduced to a score. A parent wants to help, but receives either too little context or a long report. A school leader can see systems and accounts, but not whether the right person knows what to do next.

Kanni started with a simple idea: one learning goal should become a useful next task for each person around the learner.

Kanni means a link or node in Malayalam. That is the product. It connects a school administrator, teacher, student, and parent without giving every role the same information or control.

## What Kanni does

Kanni is a persistent school learning-support platform with four separate account types.

The administrator sees the school accounts, assigned relationships, and current handoff. The teacher reviews a fractions plan, anticipates likely misconceptions, chooses a support strategy, and publishes the activity. The student makes a first choice, opens that support, revises the answer, and explains the reasoning. The same teacher reviews the evidence, chooses what should happen next, and approves one home activity. The linked parent receives a short summary and the reviewed activity, then sends one bounded response. When the student returns, the next activity has changed because of the teacher's decision.

The current learning goal is original Kanni content: compare one half and one quarter when both wholes are the same size. Keeping one complete goal let us build the whole school workflow with honest depth.

## How it was built

Kanni uses Next.js 16, React 19, TypeScript, PostgreSQL 18, Prisma 7, and Docker Compose.

Passwords are hashed with bcrypt. The browser receives an opaque HttpOnly token, while PostgreSQL stores only its hash and session expiry. Reads and writes are scoped by school, role, and assigned relationship. The learning cycle is a database state machine, so an old or repeated action cannot silently skip a handoff.

The production topology has a one-shot migration container, an internal PostgreSQL network, and a non-root, read-only application container with dropped Linux capabilities. The local development database uses its own project name, volume, database, and loopback port.

English and Malayalam are fixed product dictionaries. Changing the language updates the signed-in user's preference and changes the actual portal, including the family activity.

## How Codex changed the build process

Codex was used as an engineering partner, not as a substitute for product decisions. It helped inspect the existing implementation, challenge the broad tutor approach, model the role and relationship rules, design the database, implement the authentication and cycle transitions, compare the Docker topology with an existing production-shaped system, build tests, and review the finished change.

The most important change was architectural. The early version stored one local record and let a reviewer switch perspectives. Codex helped replace that with password accounts, revocable server sessions, persistent PostgreSQL records, relationship-scoped data access, transaction-backed mutations, Docker deployment, and a complete four-account browser journey.

The human decision was to keep the product narrow in content but complete in operation. That meant one learning goal, four real accounts, one full loop, and no claim that unfinished curriculum breadth was a feature.

## How GPT-5.6 is used

GPT-5.6 Sol is optional. A teacher can request a structured plan draft, and a student can open a strategy-specific support draft after the teacher has selected that strategy.

The provider receives only the bundled fractions context and selected strategy. It does not receive a learner name, email, answer history, family response, session, or school membership. Output must pass a strict Zod schema, use allowlisted source IDs, and satisfy a deterministic strategy check. There is no retry, tool use, recursive agent, or provider fallback.

Most importantly, Kanni remains complete when AI is off. Reviewed project-authored content is always available. AI cannot publish a plan, authorize a user, grade a student, or contact a family.

## Challenges

The first challenge was choosing a complete product slice. A broad tutor across many grades looked larger but made the teacher, parent, and school views feel separate. The connected cycle gave each role a real responsibility and made the teacher's decision visible in the student's next task.

The second challenge was access control. A role label was not enough. A teacher must be assigned to that student, a student must be enrolled in that cycle, and a parent must be explicitly linked. Those checks now exist in both the read path and the database write conditions.

The third challenge was making Malayalam a real preference, not decoration. The locale now persists on the user and applies across public pages and portals. A browser test at 360 pixels verifies that visible content and the document language change.

The fourth challenge was honest AI use. The approved Build Week Codex credit does not fund application API traffic. We kept AI optional, bounded its model and route, disabled retries and fallback, and required external spend and traffic controls before production activation.

The fifth challenge was deployment discipline. We wanted a local setup that did not disturb other PostgreSQL containers and a production topology that did not expose the database. Isolated Compose projects, internal networks, committed migrations, and hardened containers solved those concerns.

## What we learned

A small lovable complete product is not the same as a thin MVP. Users can forgive narrow content when the job itself is finished. They do not forgive a workflow that stops at a screen.

We also learned that trust works better as architecture than as a marketing page. A parent should receive less data by design. AI should be unable to publish by design. A stale form should fail at the database transition. Secrets should stay out of the image. These choices are stronger than asking users to read a list of promises.

## What comes next

The next school-operations slice is account provisioning, relationship approval, password recovery or school SSO, and staff MFA. After that come retention and deletion workflows, notifications, backup and restore operations, monitoring, and multi-membership school selection.

Content will grow only through reviewed, rights-cleared lesson packs and teacher feedback. Malayalam copy will receive a final native educator review before real school use.

Kanni will stay focused on the same promise: help every learner take the next useful step by making sure the right person can act at the right time.

> Kanni is independent. It is not affiliated with or endorsed by SCERT Kerala or the Government of Kerala.
