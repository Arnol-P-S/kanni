# Kanni demo video script

Target length: 2 minutes 56 seconds. Narration and captions are in English.

## Prepare the recording

Use adult-operated accounts and original school-authored curriculum. Do not show
emails, passwords, environment files, provider keys, browser developer tools, or
personal notifications.

Before creating the recording state, confirm `/api/health` reports an available
database, teacher AI, and student help. Student help remains off unless the school
operator has reviewed external student-data processing and enabled both student
release controls. Do this check before screen recording so no configuration or
secret appears in the video.

Create these states through the real interface before recording clips:

1. Keep the administrator, teacher, student, and parent accounts connected.
2. As administrator, add one original curriculum pack and keep it active.
3. As teacher, create a planning studio from that pack.
4. Record the teacher AI request as one clip. Cut the waiting time, but do not fake
   the returned state.
5. Publish the plan. Record the student first attempt and AI-help request as a
   separate clip, then complete and submit the work.
6. Record the teacher review and parent response.
7. Keep one final administrator clip showing the completed handoff and recorded AI
   usage. The administrator view must not show the learner's raw work.

## 0:00 to 0:13

Screen: Landing page, Kanni mark, four roles, then the agency-loop diagram.

Narration: “Most school AI is built to deliver answers faster. Kanni takes another
path: teachers gain leverage, while students make, test, question, and revise their
own ideas.”

## 0:13 to 0:34

Screen: Administrator workspace. Show role permissions, one connected support
circle, and the active curriculum library. Briefly show the add-curriculum form,
section count, version, checksum, and archive control.

Narration: “The administrator manages real role accounts, responsibility mappings,
and versioned curriculum. Content is split into checksummed sections. Teachers can
reuse an active version, while an old version can be archived without rewriting a
past learning record.”

## 0:34 to 1:09

Screen: Teacher creates or opens the planning studio. Show the source sections and
the AI boundary. Click the AI planning button, cut the waiting time, then show the
persistent completed-request panel, model, prompt version, citations, cost, and the
editable plan.

Narration: “The teacher begins with a learning goal and an approved curriculum
pack. Kanni already provides an editable local plan. When the teacher explicitly
requests AI planning, GPT-5.6 receives the goal and at most six relevant sections,
not account names or learner work. A strict schema requires differentiation,
misconception probes, checks, choices, making, reflection, and a family activity.
Unknown citations or unsafe output hide the whole response. The teacher still
edits, reviews, and publishes the plan.”

## 1:09 to 1:53

Screen: Student workspace. Choose an interest route and maker path, enter a
prediction, then write a first attempt. Show that both support buttons are disabled
before the attempt. Open the teacher-reviewed prompts, confirm adult supervision,
request Creative thinking coach, cut the waiting time, and show the three grounded
question-and-action cards. Then move through critique, revision, explanation, and
reflection.

Narration: “The student does not begin with a chatbot. They choose a route, predict,
and make a first version. Only then can they open teacher-reviewed prompts or make
one AI-help request. For that request, GPT-5.6 receives the first attempt and at
most four relevant sections, after an adult confirms supervision. It returns
questions and small experiments, never a finished answer. The student decides what
to test, finds a weakness, revises the work, explains why it changed, and finishes
with a self-check they can repeat without AI.”

## 1:53 to 2:18

Screen: Teacher evidence review. Show the prediction-to-reflection sequence and the
expandable audit of AI questions. Enter feedback, choose the next scaffold level,
and open the family activity.

Narration: “The teacher reviews how the thinking changed, including which support
was opened and which AI questions were shown. The model never chooses the learner's
level. Here the teacher selects lighter support for the next studio and writes the
feedback and family activity.”

## 2:18 to 2:34

Screen: Parent mobile view. Edit a short response, submit it, then cut to the
administrator handoff board. Keep the unique learner draft absent from both views.

Narration: “The parent receives one reviewed activity and can edit a response before
sending it. Raw drafts, AI text, scores, ranks, and diagnoses stay out. The
administrator sees the handoff finish without opening private student work.”

## 2:34 to 2:48

Screen: Architecture diagram, prompt-version code, and the passing test summary.

Narration: “Prompt and context engineering are versioned in code. PostgreSQL
enforces role and workflow boundaries. Fifty-six unit tests, fifty-one deterministic
cases, and a clean four-role browser journey verify grounding, safety, permissions,
privacy, and accessibility without spending AI credit.”

## 2:48 to 2:56

Screen: README section about Codex and GPT-5.6, then the Kanni closing frame.

Narration: “Codex helped turn the early static lesson into this tested system.
GPT-5.6 prepares support. Teachers decide. Learners create.”

## Recording checks

- Keep the exported video below three minutes.
- Record at 1080p or higher and zoom enough for text to remain readable.
- Use quick cuts between roles. Remove provider waiting time, but keep the real
  before and after states.
- Use only original Kanni screens, diagrams, narration, and music you are licensed
  to use. Silence is safer than unlicensed music.
- Do not show SCERT logos, textbook pages, third-party marks, or real child data.
- Explain any Malayalam interface text in the English narration.
- Confirm that captions match the final edit before upload.
- Upload the final video to YouTube as a public video.
