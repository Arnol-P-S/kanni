# Kanni security and safety model

Last updated: July 17, 2026

## Release posture

Kanni is a concept demo intended for public testing with synthetic profiles. Its public deployment is not yet verified. It is not approved for real child data, school use, or automated academic decisions.

Optional AI is off by default. The revised cycle has a bounded OpenRouter integration for an adult-operated GPT-5.6 plan draft or visual support. It uses fixed Kanni content, structured output, an Azure-only Zero Data Retention route, no provider fallback, no automatic retry, and a reviewed fallback. It has not been approved for real learner use or live-evaluated in this release.

The admin, teacher, student, and parent flow remains complete without a model request.

## Protected assets

- a learner's safety and privacy
- lesson and source integrity
- separation between synthetic activity data and real identity
- server secrets and provider credentials
- the fixed AI budget and rate limit planned for a future runtime
- the accuracy of public claims, eval results, and review status
- the availability of project-authored fallback content

## Trust boundaries

1. **Browser:** untrusted. It holds signed synthetic session and workspace cookies, but a person, extension, or script controls the client.
2. **Role Server Actions:** untrusted form input reaches session, role, relationship, and Zod checks before a mutation.
3. **Retained public route boundary:** untrusted input reaches `GET /api/health`, `POST /api/adult-gate`, and `POST /api/tutor`.
4. **Server configuration:** trusted only when set through server-only environment variables. Health responses expose booleans and reason codes, not secret values.
5. **Lesson registry:** trusted project-authored content with stable IDs. External textbook pages are link-only.
6. **OpenRouter and routed model provider:** disabled by default and always a separate data, billing, retention, and policy boundary.
7. **External links:** outside Kanni's control. Their content and privacy terms can change.

## Data classification

| Class | Examples | Current handling |
|---|---|---|
| Public | lesson text, source metadata, interface copy, eval category counts | Bundled in the app or repository. |
| Signed same-device synthetic workspace | fictional mapping, plan state, option IDs, explanation ID, support use, teacher review, family language and response | HMAC-signed HttpOnly cookie with a two-hour lifetime. Rejected on tampering, but not encrypted identity storage. |
| Synthetic session | fictional persona ID, adult confirmation, issue and expiry time | Separate HMAC-signed HttpOnly cookie. It demonstrates authorization logic, not identity proof. |
| Transient restricted input | a future adult-supervised Class 11 custom question | AI is off, so the form cannot submit to a model. A future path must not persist or log the field. |
| Secret | signing secret, provider key, hosting token | Server-only environment variables. Never expose through `NEXT_PUBLIC_`, health output, logs, screenshots, or reports. |
| Prohibited | a real child's name, school, location, contact details, health data, private story, persistent identifier, raw transcript | Do not enter, collect, store, or use for Build Week testing. |

The synthetic session is not an account. The signature proves server issuance and integrity, not who is operating the browser.

## Threat model

| Threat | Example | Present control | Remaining risk or required next control |
|---|---|---|---|
| Role escalation | A synthetic student opens the teacher portal or submits a teacher action. | Dynamic portals and every mutation require the expected role or broad capability. Browser coverage confirms a wrong-role portal redirects safely. | This is demo authorization, not production identity. Real use needs SSO or another reviewed identity flow. |
| Cross-relationship access | A guardian or teacher uses the correct role against an unrelated learner. | Capability checks are followed by organization and assigned, enrolled, or linked relationship checks. | The demo has only one fixed circle. Production needs tenant-isolated identifiers, object-level tests, and audited membership changes. |
| Session or workspace tampering | A tester edits a persona, mapping, or activity state in a cookie. | HMAC-SHA256 signatures, timing-safe comparison, strict Zod parsing, expiry checks, and cookie-size limits reject changed or malformed values. | A stolen cookie can still be replayed during its short lifetime. Use HTTPS and add revocation or server sessions for real accounts. |
| Personal-data entry | A prompt contains a phone number, address, school, or name. | Strict length limits and fixed English/Malayalam pattern checks run before generation. AI is disabled. | Pattern checks cannot find every form. Keep real-child testing prohibited and add provider-approved moderation before a live runtime. |
| High-risk disclosure | A learner says they may self-harm or reports abuse. | Ordered fixed rules return a project-authored card with trusted-adult guidance and 1098, 112, and 14416. No model writes the card. | Phrase matching has language and paraphrase limits. Human safety review is still required. |
| Prompt injection | A user asks to ignore instructions, reveal a prompt, invent a source, or give an answer key. | Fixed rules abstain. Prompts delimit custom text as untrusted. Models receive no tools. | Run adversarial live evals before activation. |
| Request-shape confusion | A client sends Class 11 free text as a Class 1 hint or invents an answer ID. | A strict discriminated Zod union and trusted guided IDs reject invalid combinations. | Keep schemas versioned when adding lesson modes. |
| Model fabrication | A model invents a lesson section, check, or confusion code. | Server validation accepts allowlisted IDs only and hides invalid output. | A valid ID can still support a weak claim. Human eval and source critics remain necessary. |
| Unsafe model output | A response repeats personal data, high-risk language, or a Class 1 answer. | Post-generation screening and Class 1 answer-leak checks reject it. | Screening is not proof of safety. Run predeclared live cases, complete human review, and keep fixed fallbacks. |
| Cost amplification | A client repeatedly invokes the optional plan or support action. | AI is disabled by default, essential work has a static path, each action makes at most one call, and calls have no automatic retry. | Add host rate limits, concurrency controls, alerts, and an OpenRouter spend cap before activation. |
| Provider or network failure | Timeout, refusal, 402, 429, or malformed response. | The route returns a fixed unavailable response and keeps project-authored content usable. | Test the deployed recovery path with the chosen provider. |
| Cookie replay | A copied valid demo cookie is reused before expiry. | Two-hour expiry, HttpOnly, SameSite=Lax, Secure by default in production, and no real identity or sensitive data. | A production service needs server-side revocation, device and incident policy, and stronger identity assurance. |
| Cross-site embedding | Another site frames the app. | `X-Frame-Options: DENY` and Content Security Policy `frame-ancestors 'none'`. | Recheck the deployed headers after every hosting change. |
| Unapproved browser connection or content source | A changed client tries to load a remote script, image, frame, or API. | Content Security Policy restricts scripts, styles, fonts, images, connections, objects, forms, and base URLs. | The policy permits inline styles and production inline scripts for the current Next.js output. Recheck before a wider release. |
| Browser capability access | The app requests camera, microphone, or location. | `Permissions-Policy` disables all three. | Recheck when adding any browser API. |
| Referrer leakage | A link sends the current route as a referrer. | `Referrer-Policy: no-referrer`. | External sites still apply their own collection rules after navigation. |
| Content-rights breach | A public textbook is copied into lesson context. | Source metadata distinguishes ingested from link-only; unknown rights cannot be ingested. | Human review must verify every new source and derived asset. |
| Misleading evidence | A deterministic preflight is described as model quality. | Trust and submission copy separate deterministic, live-model, human-review, deployment, and educational evidence. | Recheck every public claim before submission. |

## Current controls

- signed two-hour synthetic sessions with HttpOnly, SameSite=Lax cookies and Secure enabled by default in production
- signed, size-limited `GrowthCycle` workspace with strict Zod parsing and tamper rejection
- broad role capability checks followed by organization and relationship authorization
- dynamic server rendering for every role portal
- Zod validation for every role mutation
- strict TypeScript and Zod schemas at request and response boundaries
- Unicode normalization before prompt routing
- lesson-specific request variants
- fixed source, check, confusion, and critic issue-code allowlists
- fixed safety and unavailable responses
- no model tools, web search, file search, or previous-response chain
- no automatic model retry
- response token and timeout limits in both optional AI boundaries
- `Cache-Control: no-store` on API responses
- short-lived signed adult-gate design, unavailable while AI is off
- no analytics SDK or request-body logging in the application
- security headers for content policy, framing, cross-origin opener and resource policy, content sniffing, referrers, camera, microphone, and location
- OpenRouter provider route constrained to Azure, ZDR, no provider data collection, and no fallback
- no synthetic names, learner choices, family response, workspace token, or free-text learner prompt in the GrowthCycle AI request
- deterministic role and lesson paths when AI is unavailable

`store: false` in a provider request is not Zero Data Retention. A provider must not receive personal data from children under 13 without the required approved retention setup. See [OpenAI Under 18 API Guidance](https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance) and [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data#data-retention-controls-for-abuse-monitoring).

## Provider release gate

Do not activate model calls outside local adult-operated judging until every item below has evidence:

- host and provider use explicitly approved for this child-directed context
- separate API funding approved, since Codex credit cannot pay application API usage
- demo session configured with a random server-only secret of at least 32 characters
- OpenRouter key stored server-side with an account spending limit
- Azure-only Zero Data Retention route availability verified for the exact model
- model-request logging disabled or redacted at every layer
- retention behavior documented in `/privacy`
- fixed prompts contain no real learner fields and generated claims remain inside the original fractions schema
- fixed spend cap and host rate limit active
- deployed actions pass role, relationship, privacy, route-selection, refusal, timeout, 402, 429, and malformed-output tests
- live eval results and known failures published without unsafe prompts or model reasoning
- adult teacher and native Malayalam reviews recorded

The emergency control is `AI_DEMO_ENABLED=false`. The safer revised default is `GROWTH_AI_PROVIDER=disabled`.

## Internal self-review findings

This table records the July 17 code and design review. “Implemented” means the control is present in the working tree. It does not mean an independent reviewer approved it.

| Priority | Finding | Action in this tree | Evidence state |
|---|---|---|---|
| High for public AI | A synthetic session can be created by any adult tester, so repeated model actions could consume the OpenRouter balance. | Made plan and support generation one-shot per cycle, kept AI off by default, allowlisted one model, and made production capability require explicit rate-limit and spend-limit confirmations. | Application replay is bounded. A real host rule and OpenRouter key limit remain required before setting the confirmations. |
| High | A valid structured student support could still contain unsafe or unrelated prose. | Added a strategy-specific deterministic content gate for required fraction concepts and disallowed links, contact requests, secrets, diagnosis, ranking, careers, medical advice, and high-risk terms. | Mocked output tests verify rejection and reviewed fallback. Human and live model review remain pending. |
| Medium | Every synthetic role could reset the shared cycle. | Restricted the reset action and button to the synthetic tenant admin. | Code path and role journey reviewed. |
| Medium | UI-hidden Server Actions could skip support, republish, replay a model call, or challenge a record before evidence existed. | Added domain preconditions and one-shot transitions, plus action-level replay checks before model construction. | Unit tests cover skipped and repeated transitions. |
| Medium | Teacher support choices were stored but did not change the student or family behavior. | Added three trusted support presentations and used the teacher choices in both downstream views. | Desktop and mobile browser journey selects two non-default strategies and verifies both changed views. |
| Blocker | The planned Vercel AI Gateway path conflicts with current restrictions for services directed at children. | Added a public capability decision, blocked the provider, disabled adult confirmation, and repeated the check in the adapter factory. | Implemented. Approval of a replacement host and provider remains pending. |
| Blocker for future AI | Fixed phrase screens cannot identify every high-risk, abuse, or personal-data paraphrase. | Routed known cases before the adult gate, added normalized regression coverage, prohibited real-child testing, and kept every model provider hard-disabled. | Current static release is protected. Provider-approved classification and adversarial live evaluation are required before activation. |
| Blocker for future AI | A valid lesson-section ID does not prove that every generated claim follows from that section. | Strictly reparse outputs, reject unknown IDs and off-topic content, show model origin, keep `sourceMatched` false for generated content, and keep AI disabled. | Source entailment and human release evidence remain mandatory before any `sourceMatched` live claim. |
| High | Untrusted learner or candidate-answer text could terminate a prompt delimiter. | Serialized untrusted values as escaped JSON data and added prompt-boundary injection rules. | Regression and prompt tests added. |
| High | A future adapter could return extra internal fields outside its SDK schema. | Centrally reparse tutor and critic output through strict Zod schemas and construct the response field by field. | Validation tests reject extra fields. |
| High | Arbitrary Class 1 answer text could be placed in a model prompt. | Replaced it with strict trusted question and answer IDs and rejected mismatched or correct-answer hint requests. | Unit and route tests added. |
| High | Class 1 Deep Check could turn one hint into three provider calls. | The Class 1 request schema accepts only `deepCheck: false`; Deep Check also has a server kill switch. | Schema and runtime tests added. |
| High | A model could reveal the fixed Class 1 answer in a hint. | Added digit, English-word, and Malayalam-word answer-leak screening. | Unit tests added. |
| High | A source critic without source text could not check grounding. | The critic prompt now receives only the trusted cited section text and kind-specific issue codes. | Prompt and validation tests added. |
| High | The teacher strategy changed a banner but not the activity. | Class 1 now selects trusted question and visual data; Class 11 now selects a trace table, complete worked example, or explanation prompt. | Browser coverage added. |
| Medium | A transitive Next.js PostCSS version had a published moderate advisory. | Pinned PostCSS 8.5.19 through a package-manager override and refreshed the lockfile. | Fresh dependency audit reports no known vulnerabilities. |
| Medium | The public tutor route could read an unbounded request body before its capability check. | Added a streaming 8 KiB limit that returns 413 before schema parsing or classification. | Oversized-body route coverage added. Host rate limiting is still required. |
| Medium | GitHub Actions used mutable major-version tags. | Pinned checkout, pnpm setup, and Node setup actions to the immutable commits behind their verified v6 tags. | Workflow token permissions remain read-only. |
| Medium | The local record schema capped attempts at 12 while the learner could keep retrying. | Changed the record to a rolling 12-attempt history. | Transition coverage confirms the 13th and later attempts do not throw. |
| Medium | Unknown-rights content could be marked for ingestion. | The source schema rejects `ingested` with an unknown rights basis. Third-party textbook pages remain link-only. | Schema and registry tests added. |
| Medium | “Interface language” implied that every fixed string was translated. | Relabelled the control as learner-content language. | Browser label check added. |
| Medium | Internal project authorship and independent human review were easy to confuse. | Trust and submission copy now state that teacher, parent, security, and native Malayalam reviews are pending. | Public copy updated. |
| Medium | Privacy and prototype terms were mixed into one Trust page. | Added separate `/privacy` and `/terms` routes and linked them from the footer. | Type, lint, unit, deterministic eval, production build, and browser checks passed. |

Known pending work after this review:

- independent security review
- adult teacher, parent, recent adult learner, and native Malayalam review
- public deployment and header verification
- provider-approved live model eval, only if supervised AI remains in scope
- monitored private reporting contact before any wider release

## Incident response for the prototype

If unsafe content, personal-data handling, unexpected provider traffic, or budget use is found:

1. Set `AI_DEMO_ENABLED=false` and confirm `/api/health` reports unavailable.
2. Preserve only non-sensitive technical evidence. Do not copy a child's message into an issue, log, screenshot, or chat.
3. Record the route, release version, time, response status, and synthetic reproduction.
4. Identify whether the first failure occurred in input routing, capability checks, provider handling, output validation, or interface copy.
5. Add a synthetic regression case and test the recovery path.
6. Publish a corrected limitation if a public claim was wrong.

Do not promise that Kanni contacted a parent, teacher, school, emergency service, or support line. The prototype does not make those contacts.

## Security review status

Automated checks and an internal code review do not replace independent review. At the time of this document:

- external security review: not completed
- Kerala teacher review: not completed
- parent usability review: not completed
- native Malayalam review: not completed
- real-child testing: prohibited for this version
- live model eval: not completed
- public deployment review: not completed

Report these as pending. Do not convert them into pass claims.

## Content and dependency reporting

Do not include secrets, real personal data, unsafe prompt text, or hidden model reasoning in a report. A safe report contains a synthetic reproduction, affected version, expected behavior, observed behavior, and impact.

This repository does not publish a staffed security contact or response-time promise. Before a wider release, the owner must add a monitored private reporting channel and a disclosure policy.

## Related documents

- [System design](docs/SYSTEM-DESIGN.md)
- [Privacy notice](app/privacy/page.tsx)
- [Prototype terms](app/terms/page.tsx)
- [Trust page](app/trust/page.tsx)
- [Vercel Acceptable Use Policy](https://vercel.com/legal/acceptable-use-policy)
- [Vercel AI Product Terms](https://vercel.com/legal/ai-product-terms)
