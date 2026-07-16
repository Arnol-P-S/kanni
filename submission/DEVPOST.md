# Devpost handoff

## Core fields

- Project name: Kanni | കണ്ണി
- Tagline: One learning goal. Four people moving it forward.
- Category: Education
- Elevator pitch: Kanni turns one learning goal into clear, connected work for a student, teacher, parent, and school administrator.
- Project story: Use `submission/PROJECT-STORY.md` after replacing pending evidence with a verified result or stated limitation.
- Repository URL: Add after the public GitHub repository is verified.
- Demo URL: Add after the public deployment is verified.
- Video URL: Add after the 2 minute 50 second captioned video is public.
- Codex feedback Session ID: Add after `/feedback` is complete.

## Working product statement

Kanni demonstrates one fractions goal across four fictional adult-operated profiles. Admin maps a support circle. Teacher reviews and publishes a plan. Student attempts, opens another representation, revises, and explains. Teacher approves a family brief. Parent receives one filtered home activity and sends one bounded response.

The synthetic session and `GrowthCycle` are HMAC-signed and expire after two hours. Every mutation validates its input and checks both role and mapped relationship. This demonstrates access rules and same-device continuity. It is not production identity or school SSO.

## Technology statement

Node.js 24 LTS, Next.js 16, React 19, strict TypeScript, Tailwind CSS 4, Zod, Vercel AI SDK 7, OpenRouter AI SDK provider 3, Vitest, Playwright, Axe, signed HttpOnly cookies, and original Kanni content.

Optional GPT-5.6 Sol use is limited to a structured teacher-plan draft or one visual support. The path is off by default, requests an Azure-only Zero Data Retention route, denies provider data collection, disables provider fallback and automatic application retry, validates structured output, and returns reviewed Kanni content after any failure. There is no recursive agent loop.

## Credit and model status

- The approved $100 credit is Codex credit, not application API credit.
- OpenRouter requires a separate balance and account spending limit.
- No paid live model eval is claimed in the current evidence.
- The complete four-role cycle works without a model.
- A live GPT-5.6 claim requires the exact route, model, run date, prompt version, content version, pass count, cost, and known failures.

## Verified repository evidence

- 168 unit tests passed
- 32 of 32 deterministic safety and routing cases passed
- 18 Playwright journeys passed across desktop and mobile
- zero serious or critical Axe findings in the tested flows
- production build passed on Node.js 24.18.0
- five architecture diagrams generated; the two revised role diagrams visually inspected

Refresh these counts after any later code change.

## Evidence still needed before submission

- public deployment and security-header route check
- Git commit and `build-week-submission` tag
- live model run only if the optional path is intentionally funded and enabled
- adult teacher, parent, recent adult learner, and native Malayalam review
- independent security review
- final screenshots and public video
- Codex `/feedback` Session ID

## Claims to avoid

- full Classes 1 to 12 or SCERT curriculum coverage
- SCERT or government endorsement
- school, statewide, or production readiness
- improved academic performance
- real authentication or verified identity
- a live GPT-5.6 result without a recorded live run
- Codex credit as payment for application API calls
- a deterministic eval as model quality

Use this disclosure near the project links:

> Kanni is an independent OpenAI Build Week prototype. It is not affiliated with or endorsed by SCERT Kerala or the Government of Kerala.

Use this capability disclosure unless the release state changes and is verified:

> Every role works with reviewed Kanni content. Optional GPT-5.6 drafting is off by default and has not been live-evaluated in the current release evidence.
