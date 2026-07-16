# Kanni project story

## Inspiration

Students rarely learn alone. A teacher plans and notices, a student tries and explains, a parent helps at home, and an administrator connects the right people. Yet most education tools split those people into separate dashboards or make the chatbot the center of the product.

Kanni means a link or node in Malayalam. We used that meaning as a product test: one learning goal should become useful work for all four people, and each handoff should change what the next person can do.

## What Kanni does

The Build Week demo follows one original fractions goal: compare one half and one quarter.

First, Asha, the synthetic administrator, maps a fictional teacher, student, and guardian inside one learning circle. Meera, the teacher, reviews a plan, likely misconceptions, a quick check, and the first support before publishing. Diya, the student, makes an initial choice, opens a visual representation, revises, and explains the new choice. Meera reviews that activity evidence and approves one family activity. Arun, the parent, sees a plain summary and one thing to try at home, then returns one bounded response to the teacher.

Every profile is fictional and every session is adult-operated. The parent does not receive a raw learner prompt, model transcript, rank, ability label, or private teacher note. Admin receives handoff counts rather than the student's explanation. The student can also flag that the record does not reflect what they meant.

The earlier Class 1 addition and Class 11 linear-search examples remain in the repository, but the judge path is the connected four-role cycle.

## How it was built

Kanni uses Node.js 24 LTS, Next.js 16, React 19, strict TypeScript, Tailwind CSS 4, Zod, Vitest, Playwright, and Axe. Next.js Server Components render the public pages and dynamic portals. Server Actions validate mutations and enforce access rules.

The synthetic login creates a short-lived signed session with only a fictional persona ID and adult confirmation. A second signed cookie carries the compact `GrowthCycle`. HMAC signing and strict schema parsing reject tampered state. This is enough to demonstrate access rules and same-device continuity, but it is not presented as real authentication.

Authorization has two steps. The role must have the broad capability, and the profile must have the mapped relationship to this learning circle. A teacher must be assigned, a student enrolled, and a guardian linked. Invalid handoff order is rejected by explicit domain transitions before state is signed.

The original Kanni content is rights-cleared and versioned. Public textbook pages remain link-only references. The prototype does not ingest or republish textbook passages, images, questions, PDFs, or logos.

## How Codex changed the build process

Codex helped us challenge the broad first idea. Separate role dashboards still felt like a basic portal, so we changed the unit of value from a lesson page to one connected learning-support cycle.

The engineering work followed that decision. Codex helped define role and relationship rules, model valid handoffs as testable transitions, add signed synthetic sessions, build the four portal views, create the structured OpenRouter boundary, and write browser tests that change accounts without losing the shared cycle. It also helped turn privacy, rights, failure, and claim limits into code and release checks instead of leaving them as promises.

The final workflow is evidence-led. The deterministic path works first. AI is optional. Errors return reviewed content. Security and self-review are separate checks. Architecture diagrams show both the learning loop and the access boundary.

## How GPT-5.6 is used

Kanni can optionally use GPT-5.6 Sol through OpenRouter for two bounded actions: draft a structured teacher plan from original Kanni fractions content, or draft one short visual support from the same approved context.

The application controls the workflow. There is no recursive agent loop, web search, file search, tool use, or previous-response chain. Each explicit action makes at most one call, uses short output limits, has no automatic retry, and stops after 18 seconds. The provider route requests Azure only, Zero Data Retention, no provider data collection, and no provider fallback. Zod validates the returned object.

AI is off by default. A missing key, disabled flag, timeout, provider failure, or invalid object immediately returns reviewed Kanni content. The repository does not claim a live GPT-5.6 quality result because no paid live eval has been run.

The approved Build Week credit is Codex credit, not API credit. OpenRouter needs a separate balance and account limit. This separation is stated in the product and repository.

## Challenges faced

The first challenge was scope. Supporting every class and subject would have produced many shallow screens. One fractions goal gave us enough depth to prove planning, differentiation, activity evidence, family communication, access rules, and feedback continuity.

The second challenge was deciding what each person should not see. A role label alone is not authorization. The guardian link, teacher assignment, and student enrollment had to be part of the rule. We also kept raw learner prompts and transcripts out of family and admin views.

The third challenge was making AI useful without making the product depend on it. Static fallbacks are not placeholder error messages. They are the complete reviewed path. Optional model output can assist an adult, but it cannot block the cycle.

The fourth challenge was honest evidence. A deterministic safety run is not a model evaluation, a synthetic session is not production authentication, and one successful fractions event is not proof of learning improvement. The Trust page keeps those boundaries visible.

## What we learned

A community feature does not need a public feed. For Kanni, community is a private support circle around one learning goal.

The strongest AI product decisions were often outside the prompt: who may act, what data crosses a boundary, which handoff requires a human decision, what happens when the provider fails, and which claims the evidence does not support.

We also learned that a small signed state machine can test the product idea before adding a database. Production accounts, consent, tenant isolation, audit, recovery, retention, and deletion remain a separate design stage rather than hidden assumptions.

## What comes next

Before a real pilot, Kanni needs adult teacher, parent, recent-learner, native Malayalam, and independent security reviews. The optional model route needs an exact provider and retention review, a fixed spend cap, deployment rate limits, and live structured-output evals.

A later multi-device version would need production identity, tenant isolation, consent records, access logs, session revocation, data retention, deletion handling, and incident ownership. New learning goals would be added one at a time with rights metadata, teacher review, language review, and their own eval cases.

Kanni is not a finished school platform. It is a working proof that one carefully designed learning link can help four people move the same goal forward.
