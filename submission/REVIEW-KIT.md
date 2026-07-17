# Kanni review kit

## Review purpose

Review the complete learning-support cycle with the provided review accounts. Use invented information only. This session checks usability, teaching language, privacy boundaries, and operational clarity. It is not a test of educational effectiveness.

## Before the session

- Start the isolated PostgreSQL service and seed the review accounts.
- Restart the learning cycle from the school-administrator workspace.
- Confirm that AI is disabled unless the session is specifically reviewing the provider path.
- Explain that the accounts and fractions record are review data, not a real student record.
- Obtain permission before recording a quote, screen, or observation.

## Teacher review

Ask the adult teacher reviewer to:

1. Sign in with the teacher account.
2. Read the goal, success criteria, sequence, misconception labels, and quick check.
3. Choose a support and publish.
4. After student evidence is submitted, review it and choose the next support.
5. Approve the family activity.

Record:

- Can the task be completed without help?
- Is the teaching language accurate and respectful?
- Are the likely misconceptions useful and non-diagnostic?
- Does the evidence support the teacher's next decision?
- Is the family activity appropriate and clear?
- One issue found and one change made because of it.

## Parent review

Ask the adult parent reviewer to:

1. Sign in with the parent account.
2. Switch between English and Malayalam.
3. Explain what the learner worked on.
4. Explain the home activity in their own words.
5. Send one response.

Record:

- Can the task be completed without help?
- Is the summary useful without exposing too much?
- Is the activity possible with ordinary household materials?
- Is the Malayalam understandable and natural?
- Does the stop instruction feel clear and respectful?
- One issue found and one change made because of it.

## Recent learner review

Use an adult reviewer aged 18 or older.

Ask the reviewer to:

1. Sign in with the student account.
2. Complete the first choice, support, revision, and explanation.
3. Use the record-challenge control if anything feels inaccurate.
4. Return after teacher review and describe what changed.

Record:

- Can the task be completed without help?
- Does the support help thinking without simply commanding the answer?
- Is the interface respectful and free of ranking pressure?
- Is the teacher-selected next activity clearly connected?
- One issue found and one change made because of it.

## Technical and security review

Review:

- password hashing and generic login failure
- session token generation, hash storage, expiry, revocation, and cookie flags
- school, role, and relationship scope on reads and writes
- learning state preconditions and concurrent action behavior
- administrator, parent, teacher, and student information filtering
- optional AI inputs, output validation, content gate, provider policy, and fallback
- Docker networks, runtime user, read-only filesystem, secrets, migrations, health checks, backups, and recovery notes
- dependency and secret scans
- 32 deterministic cases and database-backed browser tests

Do not include passwords, provider keys, session values, real personal data, or unsafe prompts in review notes.

## Evidence record

For each reviewer, record:

- adult role and relevant experience
- date and build revision
- task completion without help: yes or no
- time to completion
- one issue found
- one product change caused by the issue
- one permission-safe observation suitable for the submission

Describe results as usability feedback. Do not claim academic improvement from a review session.
