# Kanni | കണ്ണി

Kanni turns one learning goal into clear, connected work for a student, teacher, parent, and school administrator.

This repository contains an OpenAI Build Week concept demo with one connected fractions cycle:

- an admin maps one fictional teacher, learner, and guardian
- the teacher reviews and publishes a plan
- the student tries, opens another representation, revises, and explains
- the teacher reviews the activity and releases one family brief
- the parent tries one short home activity and sends one bounded response

The earlier Class 1 addition and Class 11 linear-search slices remain available as secondary project-authored examples. Kanni does not claim full curriculum coverage, SCERT endorsement, statewide readiness, school readiness, or improved academic performance.

## What works now

One signed, synthetic `GrowthCycle` connects four authorized views on the same device:

```text
Admin maps the support circle
    ↓
Teacher publishes the goal and first support
    ↓
Student attempts, uses support, revises, and explains
    ↓
Teacher reviews the evidence and approves a family brief
    ↓
Parent receives one filtered home activity and responds
    ↓
Teacher receives the bounded family signal
```

The server checks both role and relationship before each mutation. A teacher must be assigned, the student must be enrolled, and the guardian must be linked. Admin sees operational handoff counts, not the learner's explanation. The parent sees only the teacher-approved summary and home activity.

The demo can record one exact synthetic event: the initial choice was one quarter, a visual support was used, and the revised choice was one half with an explanation. This is an activity observation, not evidence of long-term learning.

The synthetic login uses a short-lived signed session and a signed workspace. It demonstrates access rules and tamper rejection. It is not registration, school SSO, identity proof, or production authentication.

## AI status

Optional AI is off by default. The admin, teacher, student, and parent paths remain complete, and no model request is needed.

When an adult operator explicitly enables it, Kanni can use OpenRouter and one configured GPT-5.6 Sol model for two bounded actions:

1. draft a structured teacher plan from original Kanni fractions content
2. draft one short visual student support from the same approved context

The server requests an Azure-only Zero Data Retention route, denies provider data collection, disables provider fallback, makes no automatic application retry, limits output, and stops after 18 seconds. Zod validates the structured object. Any disabled flag, missing key, provider failure, timeout, or invalid object returns reviewed Kanni content.

The approved $100 Build Week credit is Codex credit, not API credit. It cannot pay for these application calls. A separate OpenRouter balance is required. A $10 ceiling is reasonable for a small adult-operated demo because AI is optional and each action makes at most one bounded call, but the exact number of runs depends on the selected route's current price. Set an OpenRouter account limit and deployment rate limit before enabling it.

## Run locally

Requirements:

- Node.js 24 LTS. `.nvmrc` pins 24.18.0.
- pnpm 11.13.1 in the 11.x line

The stack was reviewed on July 17, 2026 against current stable releases. Kanni
uses the latest production-compatible and release-matured versions, not every
same-day publication. Node 24 is retained because it is the LTS line while Node
26 is Current. ESLint 9 is retained because the Next.js 16.2 plugin set does not
yet declare ESLint 10 support. pnpm 11 enforces its 24-hour release-maturity
window and a version-specific native build allowlist.

| Layer | Verified version |
|---|---|
| Runtime and package manager | Node.js 24.18.0 LTS, pnpm 11.13.1 |
| Web application | Next.js 16.2.10 with an explicit webpack production build, React 19.2.7 |
| Type checking | TypeScript 7.0.2 primary compiler, TypeScript 6.0.3 compatibility compiler |
| Interface | Tailwind CSS 4.3.2, Lucide React 1.24.0 |
| Optional AI boundary | Vercel AI SDK 7.0.29, OpenRouter AI SDK provider 3.0.0 |
| Validation and tests | Zod 4.4.3, Vitest 4.1.10, Playwright 1.61.1, Axe 4.12.1 |

Tailwind 4.3.2 was the newest stable release older than the 24-hour maturity
window at verification time. The optional AI packages are compiled and
fallback-tested, but no paid provider or model call is claimed by the repository
checks.

Regenerating the rich diagrams also requires Python 3 and Pillow. They are not
required to run, test, or build the application.

Install and start the app:

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

No API key is needed. The safe local configuration is:

```text
AI_PROVIDER=disabled
AI_DEMO_ENABLED=false
AI_DEEP_CHECK_ENABLED=false
GROWTH_AI_PROVIDER=disabled
DEMO_SESSION_SECRET=<random value with at least 32 characters>
```

To test OpenRouter later, keep the secret server-side and use:

```text
AI_DEMO_ENABLED=true
GROWTH_AI_PROVIDER=openrouter
GROWTH_AI_MODEL=openai/gpt-5.6-sol
OPENROUTER_API_KEY=<server-only key with an account limit>
```

For a production build, capability remains off until
`GROWTH_AI_RATE_LIMIT_CONFIRMED=true` and
`GROWTH_AI_SPEND_LIMIT_CONFIRMED=true`. Set those only after the real host rule
and OpenRouter key limit exist. The flags confirm controls; they do not create
them. Never commit `.env.local`. The complete four-role cycle works without AI.

## Verify the repository

Run from the repository root:

```bash
pnpm lint
pnpm typecheck
pnpm typecheck:compat
pnpm test
pnpm eval
pnpm build
pnpm test:e2e
pnpm diagrams
pnpm audit --audit-level=moderate
```

`pnpm test:e2e` starts the existing production build on port 3173, so run `pnpm build` first.

These results were refreshed after the dependency upgrade and hardening work.
Repeat the gate after any later source or lockfile change.

| Evidence | Current public claim |
|---|---|
| Final lint, type, unit, build, and browser run | Passed on Node.js 24.18.0 LTS on July 17, 2026: ESLint, TypeScript 7, 168 unit tests, 21 application routes, and 18 browser journeys across desktop and mobile |
| Accessibility in browser journeys | Zero serious or critical Axe findings in the tested flows; keyboard, reduced-motion, 360-pixel, and 200-percent zoom paths passed |
| Deterministic eval | 32 of 32 passed on July 17, 2026 with tutor-v1.2.0, math-1.1.0, and cs-1.0.0; this is not a model run |
| Dependency audit | Zero known vulnerabilities at the moderate threshold after the final lockfile install |
| Generated assets | Five rich diagrams and seven revised submission screenshots generated and visually inspected |
| Live model eval | Not run |
| External security review | Not completed |
| Adult teacher and parent review | Not completed |
| Native Malayalam review | Not completed, Malayalam remains preview |
| Public deployment verification | Not completed |
| Public video | Not recorded |
| Codex `/feedback` Session ID | Not recorded |

## System design

Next.js Server Components render public pages and dynamic role portals. Server Actions own signed mutations. Small client components remain only where the retained lesson activities need browser interaction.

![Kanni four-role learning support cycle](docs/diagrams/render/learning-support-cycle.png)

```text
Synthetic role session
  ├─ broad role capability
  ├─ organization and relationship authorization
  └─ strict Zod form boundary
          │
          ▼
Signed GrowthCycle workspace
  ├─ admin mapping
  ├─ teacher plan and review
  ├─ student evidence and challenge
  └─ filtered parent brief and bounded response
          │
          ├─ reviewed Kanni content by default
          └─ optional structured OpenRouter draft
```

There is no database, real learner account, identity proof, vector store, file search, model tool call, analytics SDK, or free-running agent loop.

Read the [system design](docs/SYSTEM-DESIGN.md) for all five rich diagrams, the current and target architectures, API boundaries, failure matrix, decisions, and integration stages. Read [SECURITY.md](SECURITY.md) for the threat model, data classification, provider release gate, and incident steps.

### Patterns used for concrete change points

| Pattern | Kanni use | Why it exists |
|---|---|---|
| Explicit domain transitions | ordered `GrowthCycle` handoffs | impossible role handoffs fail before state is signed |
| Strategy | trusted Class 1 activity variants selected by the teacher | the activity behavior changes while the learner flow stays stable |
| Adapter | narrow model-provider and structured-output boundary | provider SDK code stays outside domain rules |
| Facade | one tutor orchestration entry point | routes do not own model and critic sequencing |
| Functional Chain of Responsibility | ordered privacy, safety, injection, advice, and lesson-scope rules | the first matching rule chooses a fixed route |

Kanni does not add a pattern when a small function or data map is enough. The design uses the [Refactoring Guru pattern catalog](https://refactoring.guru/design-patterns) as a shared vocabulary, not as a checklist.

## API routes

| Route | Current behavior |
|---|---|
| `GET /api/health` | Reports application and public AI capability without calling a model or returning a secret |
| `POST /api/adult-gate` | Returns 503 while no provider is approved; an approved future path would set a short-lived hardened cookie after explicit confirmation |
| `POST /api/tutor` | Validates a strict request; returns fixed safety or off-topic responses before the adult gate; otherwise requires a valid cookie, then returns unavailable while capability is off |

High-risk phrases use a fixed safety card before the adult gate. The card lists Child Helpline 1098, emergency 112, and Tele-MANAS 14416. Kanni does not ask a model to write crisis advice and does not claim to contact anyone.

## Dormant tutor integration

The future tutor boundary is already narrow and testable:

- one exact lesson pack per request
- strict lesson-specific request variants
- at most 400 normalized Unicode code points for a Class 11 custom question
- trusted guided IDs for Class 1
- source, check, confusion, and critic issue-code allowlists
- structured output validation
- Class 1 answer-leak checks
- no tools, web search, file search, or response chain
- no automatic provider retry
- fixed output and timeout limits
- optional two-critic fanout with isolated failures

The presence of this code is not evidence of a live GPT-5.6 run. A live claim requires a compliant provider, a deployed API run, exact model and prompt versions, pass counts, and known failures.

## Privacy and child-safety limits

Kanni uses synthetic profiles only. Real-child testing and real child personal data are excluded.

The signed demo workspace stores fictional relationship flags, plan state, fixed answer and explanation IDs, support use, teacher review state, strategy, family language, and one bounded parent response. It does not store a learner name, school, location, contact detail, health detail, custom prompt, model transcript, rank, or diagnosis.

The application includes no analytics SDK and does not log request bodies. Hosting systems may still create operational logs, so testers must not enter real personal data.

`store: false` is not Zero Data Retention. OpenAI requires additional safeguards for people under 18 and states that personal data from children under 13 must not be processed without the required approved Zero Data Retention setup. See the [OpenAI Under 18 API Guidance](https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance) and [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data#data-retention-controls-for-abuse-monitoring).

The app publishes separate `/privacy` and `/terms` routes. Repository readers can inspect the [privacy notice source](app/privacy/page.tsx) and [prototype terms source](app/terms/page.tsx).

## Content rights

Application code is licensed under MIT. Original Kanni lesson content in
`lib/lessons.ts`, `lib/growth-cycle.ts`, and
`lib/growth-support-presentations.ts` is licensed separately under CC BY 4.0.
See `CONTENT-LICENSE.md`.

SCERT pages and the textbook or handbook pages shared during planning are link-only discovery references. Kanni does not copy, index, transcribe, screenshot, redraw, or redistribute their textbook passages, images, diagrams, questions, PDFs, or logos.

- [SCERT Kerala textbook archive](https://textbooksarchives.scert.kerala.gov.in/login.php)
- [Third-party handbook listing shared during planning](https://www.arabiceduweb.in/2024/06/1-3-new-text-books-2024.html)
- [Third-party textbook listing shared during planning](https://www.arabiceduweb.in/2024/05/i-iii-v-vii-ix-new-text-books-2024.html)

Unknown rights always mean link-only.

> Kanni is an independent OpenAI Build Week prototype. It is not affiliated with or endorsed by SCERT Kerala or the Government of Kerala.

Kanni does not use “SCERT-aligned” as a product claim before a Kerala teacher approves that wording.

## Evaluation

`eval/cases.ts` defines the deterministic release set. It covers supported lesson requests, off-topic requests, injection and cheating, safety, personal data, Malayalam-English mixing, Unicode forms, and typing variation.

`pnpm eval` checks deterministic request and safety behavior. It does not call GPT-5.6 and must not be reported as model quality.

The live runner is retained for a future approved provider. It calls the deployed API and requires explicit cost confirmation plus exact model identifiers in `LIVE_EVAL_PRIMARY_MODEL` and `LIVE_EVAL_CRITIC_MODEL`. Do not run it until provider terms, API funding, spend limits, rate limits, and the deployment are approved. Unsafe prompts and hidden model reasoning must not be written to public reports.

## Codex decision record

| Problem | Codex contribution | Human constraint | Current result |
|---|---|---|---|
| Separate role dashboards felt basic | reduced the product to one shared learning goal with four authorized tasks | each handoff must change what the next person can do | one tested admin-teacher-student-parent cycle |
| A role switcher did not demonstrate access control | added signed sessions, capability checks, and relationship authorization | every role must receive a different minimum view | denied role jumps and filtered family data have unit and browser coverage |
| A teacher choice changed only a banner | mapped each Class 1 choice to trusted question data and a visual form | the decision must change the learner's next task | objects, number-line, and smaller-number variants |
| Model and provider SDK code could spread through routes | introduced a provider Adapter and tutor Facade | keep provider replacement and failure tests bounded | one dormant provider boundary with one orchestration entry point |
| Safety checks were easy to bypass with paraphrases | expanded fixed rules and added output screening | high-risk and personal-data routes must not depend on a model | ordered, testable fixed routing with static fallbacks |
| Build Week funding was Codex-only | separated Codex work funding from application API funding and added an optional OpenRouter boundary | no unapproved spending and no AI dependency | full reviewed fallback, one-call actions, and no live model claim |

No primary Codex `/feedback` Session ID has been recorded. Add it only after the required session finishes.

## Submission assets

- Project story draft: `submission/PROJECT-STORY.md`
- Timed video plan: `submission/VIDEO-SCRIPT.md`
- Adult review tasks and blank record: `submission/REVIEW-KIT.md`
- Devpost handoff and evidence placeholders: `submission/DEVPOST.md`
- Reference screenshots: `submission/screenshots/`

`pnpm screenshots` expects a production server already running on port 3173.
The current seven release screenshots were regenerated and inspected after the
final UI changes.

- `01-home-four-role-pitch.png`
- `02-synthetic-role-login.png`
- `03-admin-support-circle.png`
- `04-teacher-reviewed-plan.png`
- `05-student-visual-support.png`
- `06-parent-reviewed-activity-mobile.png`
- `07-trust-eval-evidence.png`

## External release checklist

These actions need owner accounts, policy approval, a public publishing choice, or human participation. They are not completed by the repository changes:

- choose a host and provider that permit the intended child-directed use
- approve separate API funding if a live model path remains in scope
- configure server-only secrets, a fixed spend cap, and host rate limits
- run live model evals only after the provider release gate passes
- complete adult teacher, parent, recent adult learner, native Malayalam, and independent security reviews
- verify the public repository and every public deployment route
- record and publish the captioned demo video
- run Codex `/feedback` and record the Session ID
- update the existing Devpost draft with final evidence and known failures

## License

Code: MIT, see `LICENSE`.

Original Kanni lesson content: CC BY 4.0, see `CONTENT-LICENSE.md`.
