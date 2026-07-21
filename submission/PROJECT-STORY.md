# Kanni project story

## Inspiration

School AI can make content delivery faster, but speed is not the same as learning.
If the model answers first, the learner can become a passenger. Kanni began with a
different question: can AI save teachers real planning time while requiring the
learner to make, test, question, and revise an idea?

Teachers are the main lever. A better student chatbot helps one learner in one
moment. A better planning and evidence tool can help one teacher prepare several
routes, notice likely confusion, review how thinking changed, and communicate one
useful next step to a family.

## What Kanni does

Kanni connects a school administrator, teacher, learner, and parent around one
curriculum-grounded learning studio.

The administrator creates real accounts, maps responsibility, and manages
versioned curriculum packs. The teacher selects a source the school is allowed to
use and prepares a full plan. The learner chooses
a route, predicts, creates a first version, critiques it, revises it, explains the
change, and reflects. The teacher reviews that sequence and chooses whether the
next studio begins with guided, light, or independent support. The parent receives
one reviewed activity without receiving the learner's private work.

The teacher's decision is not a label. It changes one concrete product behavior:
how many reviewed prompts appear in the learner's next studio.

## How it was built

The application uses Next.js 16, React 19, strict TypeScript, PostgreSQL 18,
Prisma 7, Zod, the Vercel AI SDK, and the OpenRouter AI SDK provider. Docker builds
separate migration and application images.

The domain is a versioned state machine. Every transition checks the school, role,
relationship, expected status, and current version. Parent and administrator data
queries omit raw learner submissions before the page is rendered.

Curriculum text is normalized, split into checksummed sections, and retrieved
locally. A small teacher pack does not need a vector database. The retrieval
contract leaves room for a later embedding-backed implementation for larger,
permission-cleared school collections.

## How Codex changed the build process

The early application was a static fractions lesson with four screens. It did not
prove the teacher-first idea or provide a clean school setup. We used one primary
Codex thread to inspect that implementation and replace it with a reusable learning
studio.

Codex helped define the new schemas, write the forward migration, build first-run
setup and account mapping, implement role-specific data access, create the teacher
plan editor and learner evidence flow, add the OpenRouter boundary, write the
evaluation set, build Docker verification, and prepare the diagrams and release
material.

The most useful Codex moment came from a failing clean-install browser test. Setup
looked correct, but PostgreSQL remained empty. The failure was traced to a Prisma 7
adapter error: the query API tried to deserialize the `void` value returned by
`pg_advisory_xact_lock`, so the entire serializable setup transaction rolled back.
The fix kept the lock but called it through the execution API. The original browser
reproduction then passed.

## How GPT-5.6 is used

GPT-5.6 Luna supports two optional, explicit requests through OpenRouter. For
teacher planning, Kanni retrieves up to six local curriculum sections and requests a
strict plan with success criteria, learning sequence, differentiation,
misconception probes, quick checks, interest routes, maker paths, Socratic prompts,
reflection, and family wording. After a student makes a first attempt, one separate
adult-confirmed request can return three or four grounded questions and small
experiments plus a self-check. A separate operator flag keeps this route off until
student-data processing has been reviewed. The student context is limited to the
goal, driving question, first attempt, and up to four relevant sections. It does
not ask for a finished answer.

Kanni does not add account names, parent notes, passwords, later submission fields,
or previous model conversations to either request. Teachers are told to keep names
out of the goal and source text they write. Unknown citations, unsafe text, or
answer-revealing student help discard the full output. There is no retry, provider
fallback, web search, external tool, or automatic publishing.
The teacher reviews and edits the result. When AI is off or fails, the complete
local teacher plan remains available.

## Challenges faced

The largest design challenge was making agency concrete. A slogan about critical
thinking is easy. A product must require evidence of it. That led to the stored
sequence of prediction, first version, self-critique, revision, explanation, and
reflection.

Another challenge was privacy across roles. The parent needs useful context but not
surveillance. The administrator needs operational status but not student work. We
handled that with separate relational select shapes and browser assertions using a
unique learner sentence.

Content rights also changed the RAG design. Public access to a textbook does not
grant permission to copy it. Kanni accepts original, CC BY 4.0, public-domain, or
written-permission text, and forces known SCERT hosts to link-only treatment.

## What was learned

RAG is not only retrieval. It is source rights, versions, checksums, allowlisted
citations, failure behavior, and human release control.

AI support should also have a removal plan. In Kanni, the teacher can move the next
studio from guided to light to independent. The product records whether support
was opened and asks the learner what can now be done alone.

Finally, a clean database test tells the truth. Seeded review data can hide broken
installation, account creation, and mapping paths. Kanni's main browser test creates
everything through the same interface a school would use.

## What comes next

Before real school use, Kanni needs SSO or OIDC, MFA, password recovery, account
suspension, retention and deletion tools, provider and child-safety review, ingress
rate limiting, managed secrets, monitoring, and independent security testing.

For learning support, the next work is a school-approved curriculum collection,
embedding retrieval for larger packs, group planning for a whole class, an outbox
for notifications, and optional voice access after a separate consent and data
review.

The current release supports one school per installation and Classes 6 to 9. It
does not claim full SCERT coverage, statewide readiness, or improved academic
outcomes.
