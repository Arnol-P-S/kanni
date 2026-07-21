# Devpost draft

## Project name

Kanni | കണ്ണി

## Category

Education

## One-line pitch

Kanni helps a teacher turn approved curriculum into several ways to think, then
uses the learner's own evidence to decide what support should come next.

## Short description

Most student AI products optimize answer delivery. Kanni takes a different path.
The teacher begins with curriculum the school is allowed to use and prepares a
complete learning studio. The learner must predict, make a first version, find a
weakness, revise, explain the change, and reflect. The teacher reviews that full
sequence and chooses whether the next activity begins with guided, light, or
independent support. The parent receives one teacher-reviewed home activity, not
the learner's private draft.

GPT-5.6 supports two explicit, bounded moments. It can draft a teacher toolkit from
retrieved curriculum, and after a student's first attempt it can return creative
questions and small experiments. It never receives permission to finish the
student's answer. Unknown citations discard the entire response, and the teacher
still edits and publishes the plan.

## Inspiration

There are two ways to use AI in school. One makes content faster and risks turning
the learner into a passive consumer. The other helps the learner make, test,
question, and revise ideas with less support over time.

Kanni follows the second view. The highest-impact user is the teacher. One better
planning tool can help a teacher prepare for many learners, anticipate common
errors, offer different routes to the same goal, and communicate with families.
The learner still does the intellectual work.

## What it does

### Administrator

Creates real role accounts, maps each student to the responsible teacher and
parent, manages versioned curriculum packs, and sees handoff and AI cost status
without reading private submissions.

### Teacher

Selects an active school curriculum pack, goal, and driving question. Kanni creates
a valid local plan without AI. If the teacher requests GPT-5.6, Kanni retrieves up
to six source sections and asks for a structured plan containing success criteria,
lesson sequence, differentiation, misconception probes, quick checks, interest
routes, maker paths, Socratic prompts, reflection, and one family activity. The
teacher edits and approves the final version.

### Learner

Chooses an interest route and what to make. The five-step studio requires a
prediction, first version, self-critique, revision, explanation, and reflection.
Teacher-selected prompts are available only after a real attempt. Support can fade
from guided to light to independent. After the first attempt, the learner may make
one AI request for three or four curriculum-grounded question-and-action steps and
a self-check. Kanni does not request or show a finished answer.

### Parent

Receives the goal, one teacher observation, one next question, and one short home
activity. The parent can respond without seeing the learner's draft, critique,
revision, model output, score, rank, or diagnosis.

## How it was built

Kanni is a Next.js 16 and React 19 modular monolith with strict TypeScript. Server
actions own setup, authentication, role mapping, and learning-studio transitions.
PostgreSQL 18 and Prisma 7 store identity, relationship mappings, curriculum
sections, versioned studio state, learner evidence, teacher review, family handoff,
AI usage, and audit events.

The RAG path is deliberately small and inspectable. Teacher-entered curriculum is
normalized, divided into checksummed sections, and retrieved by local relevance.
The model may cite only retrieved IDs. Zod validates every nested field before
application code accepts the plan.

Docker provides separate migration and application images. A clean deployment has
no sample school, hidden account, password, or learner record. The first user sets
up the school through the interface.

## How GPT-5.6 is used

The optional provider route uses GPT-5.6 Luna through OpenRouter for two separate
structured tasks. Teacher planning includes the goal, driving question, class, and
up to six retrieved curriculum sections. Student help is available only after a
first attempt, a separate operator review switch, and an adult-supervision
confirmation. It includes that attempt plus at most four relevant sections.
Kanni does not add account names, family notes, passwords, later submission fields,
or prior model conversations.

The request sets `store: false`, excludes providers that collect request data,
disables fallback and retry, and uses low reasoning. Teacher plans are limited to
3,200 tokens and 40 seconds; student help is limited to 900 tokens and 20 seconds.
Current GPT-5.6 routes do not offer a matching Zero Data Retention endpoint, so
Kanni makes no ZDR claim. Unknown source IDs, unsafe or malformed output, timeout, provider
failure, or policy failure hide the generated text. The local teacher plan remains
available.

GPT-5.6 cannot publish, grade, diagnose, choose a scaffold, contact a family, or
write the learner's work. The student output is restricted to questions, small
actions, source IDs, and one self-check. A second deterministic gate rejects
answer-revealing language even when the response matches the schema.

## How Codex changed the build

The first version was a static fractions lesson. It did not prove the product idea.
In the primary Codex thread, we inspected the hardcoded path and replaced the
domain, schema, migrations, role queries, AI boundary, screens, and tests with a
generic curriculum-grounded studio.

Codex helped build the clean first-run setup, administrator provisioning, support
circle mapping, teacher plan editor, learner creation sequence, teacher evidence
review, parent privacy handoff, OpenRouter adapter, deterministic evaluation set,
Docker stack, architecture diagrams, and release documentation.

The human decisions remained explicit: teachers are the main lever, student AI
must not answer for the learner, the product must start empty, parents and
administrators must not receive raw work, and no OpenRouter call may happen
automatically.

The browser test found a real clean-install defect. Prisma's PostgreSQL adapter
could not deserialize the `void` result of an advisory lock called through the
query API, so the setup transaction rolled back. Codex isolated the first failing
boundary, changed it to the execution API, and kept the concurrency lock intact.

## Challenges

- replacing a lesson-specific data model without carrying old assumptions forward
- making the teacher plan useful even when AI is unavailable
- keeping learner agency visible in stored evidence, not only in marketing copy
- enforcing different privacy shapes for four roles
- treating public textbook access as different from permission to copy
- testing clean installation without seed data
- keeping provider cost under teacher control

## What we learned

A grounded model response is not trustworthy because two agents agree. It is
trustworthy only after the application checks its structure and every source ID,
and a responsible person reviews what will be used.

Learner agency also needs a data model. If the system stores only a final answer,
the teacher cannot see how thinking changed. Prediction, first version, critique,
revision, explanation, and reflection make the process reviewable without turning
it into a score.

## Current evidence

- 51 passing unit tests and 51 deterministic evaluation cases
- clean migrations from an empty PostgreSQL database
- a browser test that creates the school, all four accounts, mappings, curriculum,
  studio, learner evidence, teacher review, and family response through the UI
- explicit assertions that parent and administrator pages do not contain a unique
  learner revision
- role denial, generic login failure, mobile, reduced-motion, language, and Axe
  checks
- no AI request in unit, deterministic, build, or browser tests

The published scorecard describes software behavior and usability checks. It does
not claim improved academic performance.

## What comes next

The next serious school-integration work is OIDC or SAML, MFA, password recovery,
account suspension, retention and deletion tools, notification outbox processing,
school-approved curriculum collections, embedding retrieval for larger packs,
and independent security and child-safety review.

Kanni currently supports one school per installation and Classes 6 to 9. Malayalam
copy remains preview until native-speaker review is complete.

## Testing instructions

The tagged Docker build starts locally and requires no hosting or paid AI:

```bash
docker compose -f compose.judge.yaml up -d --wait
```

Open <http://localhost:3001>, create the school and administrator, then create a
teacher, student, and parent and connect the support circle. Full source setup and
test commands are in the repository README.

## Non-affiliation

Kanni is an independent OpenAI Build Week project. It is not affiliated with or
endorsed by SCERT Kerala or the Government of Kerala. The repository does not copy
or redistribute SCERT textbook material or logos.
