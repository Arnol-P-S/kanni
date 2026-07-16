# Kanni project story

## Inspiration

Kerala students do not need one more generic chatbot. A Class 1 child learning addition, a Class 11 learner tracing an algorithm, a teacher preparing tomorrow's class, and a parent helping after dinner all need different kinds of support. Kanni began with one question: can one learning moment become useful to all three roles without turning a child's conversation into data?

Kanni means a link or node in Malayalam. That became the product test. The student, teacher, and parent views should not be separate demos. One activity should connect them.

## What Kanni does

Kanni implements two narrow lesson slices. Class 1 Mathematics covers addition within 10 with Malayalam-first fixed choices, concrete counters, and a reviewed hint. Class 11 Computer Science covers linear search with a worked trace, reviewed answers, one bounded custom question, source cards, and an optional Deep Check.

The main demonstration starts when the learner selects an incorrect answer. Kanni shows a hint and asks a follow-up question. The teacher then sees exactly what happened in that activity and chooses one of three teaching strategies. The parent receives one plain-language home activity based on that choice. When the learner returns, the next activity names and uses the teacher's strategy.

The shared record contains only synthetic activity data. It does not contain a learner name, school, custom question, model transcript, rank, or diagnosis.

## How it was built

Kanni uses Next.js 16, React 19, strict TypeScript, Tailwind CSS 4, Zod, Vercel AI SDK 6, Vitest, Playwright, and Axe. The two original lesson packs are bundled with stable section IDs and a source registry. A versioned local-storage adapter carries one synthetic activity record across the learner, teacher, and parent views.

The server validates every tutor request, normalizes Unicode to NFC, applies conservative privacy and safety routes, selects one exact lesson pack, and constructs the model prompt. The model can return only allowlisted lesson section IDs, follow-up check IDs, confusion codes, and critic issue codes. An unknown ID, malformed object, provider error, or timeout hides the generated text and uses a reviewed fallback.

## How Codex changed the build process

Codex helped turn the broad first idea into a smaller connected loop that could be implemented and tested. It translated privacy, child-safety, source-rights, and failure rules into schemas, deterministic routes, and release tests before the tutor path was treated as complete.

Codex also traced two environment-specific release failures. The first was a stalled Turbopack production build, while the webpack production path completed the same source successfully. The second was a browser test attaching to an unrelated service on the default port. The final commands use webpack for production builds and an isolated port for Playwright.

## How GPT-5.6 is used

GPT-5.6 Sol is the primary bounded tutor. It receives one reviewed lesson pack and returns a structured object with a short explanation, a few steps, optional hint, and allowlisted IDs. It has a fixed output limit, an 18-second timeout, no automatic retry, no tools, no web search, no file search, and no previous-response chain.

Deep Check is optional. It runs a source critic and a teaching-and-safety critic with GPT-5.6 Luna. The two checks run in parallel and return only a short pass or warning with allowlisted issue codes. A critic failure never removes an already validated tutor answer, and agreement is not presented as proof.

All Class 1 interactions and the Class 11 suggested questions remain useful without AI.

## Challenges faced

The hardest part was not generating a plausible answer. It was deciding what the product must never do. Kanni must not copy textbook material without rights, accept child personal data, make a diagnosis, recommend a career, expose hidden reasoning, or leave the learner without a safe reviewed path.

The Class 1 and Class 11 experiences also needed different interaction rules. The younger activity uses one instruction and one action at a time, large touch targets, and no free-text field. The older lesson allows one short custom question, but only after explicit adult confirmation and only within a 400-character boundary.

## What was learned

A small connected loop is easier to explain, test, and trust than a broad dashboard with many unfinished features. Deterministic code is the right tool for identity fields, rights rules, state transitions, parent filtering, and crisis cards. The model is useful where an explanation needs flexibility, but application code must own the boundary.

The demo can truthfully report one observed event: the initial answer was incorrect, a visual hint was used, and the follow-up answer was correct. It cannot claim long-term learning improvement, curriculum completeness, or school readiness.

## What comes next

The next release tasks are a budgeted live GPT-5.6 eval, adult teacher and parent review, native Malayalam review, a public deployment, and the final public demo video. Wider curriculum coverage comes only after those checks. Real learner accounts, real child data, school integration, and automated academic decisions are outside this prototype.
