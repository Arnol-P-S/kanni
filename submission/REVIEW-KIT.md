# Adult reviewer kit

Use synthetic profiles only. Do not enter a real child's name, school, location, contact detail, health detail, or story. This is usability and content feedback, not a test of educational effectiveness.

## Before the session

- Confirm the reviewer is at least 18.
- Explain that Kanni is an independent concept demo, not a school service.
- Ask permission before using any observation in the submission.
- Reset the synthetic workspace.
- Record only task time, one issue, one resulting change, and one permission-safe observation.

## Kerala teacher task

Sign in as Asha and map the support circle. Switch to Meera, review and publish the fractions plan. Switch to Diya and complete the activity. Return to Meera, review the evidence, choose the next support, and approve the family brief.

Check:

- Is the fractions content accurate and age appropriate for the intended activity?
- Are the success criteria, likely misconceptions, and quick check useful?
- Does the evidence wording stay specific to this activity and avoid diagnosis?
- Does the teacher retain a clear decision before student and family release?
- Is any curriculum-alignment claim justified? Kanni does not claim SCERT alignment before approval.

## Parent task

Open the prepared Arun parent view without help. Explain what happened, try the paper-folding activity, and choose one bounded response.

Check:

- Is the activity summary clear and respectful?
- Is the home activity simple enough to try once?
- Is it clear that the view is not a score, rank, or diagnosis?
- Are the privacy exclusions understandable?
- Can the task be completed with low digital confidence on a phone?

## Recent adult learner task

Use only a recent Kerala learner who is at least 18. Open Diya, make the initial choice, request another representation, revise, explain, and find the record-challenge control.

Check:

- Is the learning goal clear before the first action?
- Is asking for support easy and free of shame?
- Does the visual help compare the same-sized whole?
- Can the learner explain and challenge the activity record?
- Is the difference between reviewed content and optional AI visible?

## Admin task

Map the support circle, inspect handoff status, then try to find the learner's explanation.

Check:

- Is the relationship map understandable?
- Does admin see enough operational information?
- Is learner-level explanation correctly absent?
- Does the demo avoid ranking, prediction, and public social features?

## Native Malayalam review

Review every fixed Malayalam string. Use this inventory from the repository root:

```bash
rg -lP '[\x{0D00}-\x{0D7F}]' app components lib eval -g '*.ts' -g '*.tsx'
```

Check natural wording, age fit, glyph rendering, English-Malayalam mixing, passage `lang` attributes, and consistent terms. Malayalam remains preview until this review passes.

## Independent engineering and security review

Use synthetic requests only. Review the signed sessions, signed workspace, Server Actions, role and relationship checks, parent filtering, optional OpenRouter construction, privacy notice, headers, dependency report, and threat model.

Check:

- Can a role call an action or open a portal outside its capability?
- Can the correct role access an unmapped learner or family?
- Are changed, expired, malformed, and oversized signed cookies rejected?
- Are secrets absent from client bundles, logs, screenshots, health output, and reports?
- Does optional AI remain off without all activation variables?
- Do timeout, provider error, and invalid structured output return reviewed content?
- Do public claims separate deterministic evals, live model evals, human reviews, and educational outcomes?

Do not mark this independent review complete until an adult reviewer outside the implementation provides a dated result.

## Session record

| Field | Record |
|---|---|
| Session date | |
| Reviewer role | |
| Confirmed adult | Yes / No |
| Independent of implementation | Yes / No |
| Task completed without help | Yes / No |
| Start time | |
| Completion time | |
| One issue found | |
| One product change caused by the issue | |
| Permission-safe observation | |
| Permission to quote the observation | Yes / No |

Do not describe a successful session as proof of better learning outcomes.
