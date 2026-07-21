import { SchoolRole, StudioStatus } from "@prisma/client";
import type { Metadata } from "next";
import {
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  FileSearch,
  MessageCircleQuestion,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import { EmptyWorkspace, PortalChrome } from "@/components/portal-chrome";
import { StudentStudioForm } from "@/components/student-studio-form";
import { getStudentStudioAiCapability } from "@/lib/ai/studio-ai";
import { requireActor } from "@/lib/auth";
import { getStudentStudio } from "@/lib/school-data";
import {
  parseTeacherPlan,
  StudentThinkingCoachSchema,
} from "@/lib/studio/contracts";

export const metadata: Metadata = { title: "Student learning studio" };

const notices: Record<string, string> = {
  "work-submitted": "Your full thinking process is with your teacher for review.",
  "complete-all-steps": "Complete every step before sending your work.",
  "remove-personal-data": "Remove phone numbers, email addresses, social handles, and web links before sending.",
  "activity-closed": "This activity has already moved to the next stage.",
  "activity-changed": "The teacher changed this activity. Refresh and choose from the current options.",
};

export default async function StudentPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const actor = await requireActor(SchoolRole.student);
  const studio = await getStudentStudio(actor);
  const { notice } = await searchParams;
  const plan = studio ? parseTeacherPlan(studio.plan) : null;
  const studentHelp = studio?.studentHelp
    ? StudentThinkingCoachSchema.safeParse(studio.studentHelp.response)
    : null;
  const ai = getStudentStudioAiCapability();

  return (
    <PortalChrome
      actor={actor}
      studio={studio}
      title="Think, make, test, and revise"
      intro="Kanni gives you a goal, a source, and a few possible routes. You make the prediction, create the work, find the weakness, and decide how to improve it."
    >
      {notice === "safety-support" ? (
        <section className="safety-support-card" role="alert"><ShieldAlert aria-hidden="true" /><div><h2>Pause this activity and speak to a trusted adult now</h2><p>Kanni did not save that text. If you may be in immediate danger, call 112. You can also call Childline at 1098 or Tele-MANAS at 14416.</p><p>Kanni cannot contact anyone for you and does not promise confidentiality.</p></div></section>
      ) : notice ? <p className="form-notice portal-notice" role="status">{notices[notice] ?? "Your learning studio was updated."}</p> : null}

      {!studio ? (
        <EmptyWorkspace title="Your teacher is preparing the next studio" detail="When it is ready, you will see the goal, source, maker choices, and the amount of support your teacher selected." />
      ) : !plan ? (
        <EmptyWorkspace eyebrow="Activity check" title="This studio is not ready" detail="The plan could not be validated. Your teacher has been asked to review it." />
      ) : (
        <div className="workspace-grid student-workspace-grid">
          <section className="portal-card student-mission-card">
            <div className="card-heading-row"><div><p className="eyebrow">Your mission</p><h2>{studio.drivingQuestion}</h2></div><BookOpenCheck aria-hidden="true" /></div>
            <p className="student-goal-copy">{studio.goal}</p>
            <div className="student-success-list"><strong>You are working toward</strong><ul>{plan.successCriteria.map((item) => <li key={item}><CheckCircle2 aria-hidden="true" />{item}</li>)}</ul></div>
          </section>

          <section className="portal-card student-source-card">
            <div className="card-heading-row"><div><p className="eyebrow">Curriculum source</p><h2>Check claims against the material</h2><p>{studio.curriculumPack.title} · version {studio.curriculumPack.version}</p></div><FileSearch aria-hidden="true" /></div>
            <div className="student-source-sections">{studio.curriculumPack.sections.filter((section) => plan.sourceSectionIds.includes(section.referenceId)).map((section) => <details key={section.referenceId}><summary><span>{section.referenceId}</span>{section.heading}</summary><p>{section.content}</p></details>)}</div>
          </section>

          {studio.status === StudioStatus.ready_for_student ? (
            <section className="portal-card student-work-card">
              <StudentStudioForm
                studioId={studio.id}
                plan={plan}
                scaffoldLevel={studio.scaffoldLevel}
                aiAvailable={ai.available}
                aiModel={ai.model}
                studentHelpStatus={studio.studentHelpStatus}
                initialStudentHelp={studentHelp?.success ? studentHelp.data : null}
              />
            </section>
          ) : (
            <>
              <section className="portal-card student-evidence-trail-card">
                <div className="card-heading-row"><div><p className="eyebrow">{studio.status === StudioStatus.awaiting_teacher_review ? "Work sent" : "Your evidence trail"}</p><h2>{studio.status === StudioStatus.awaiting_teacher_review ? "Your teacher is reviewing how your thinking changed" : "See what changed from your first idea to your revision"}</h2><p>The final version is only one part of the work. Your prediction, critique, and reason for changing it stay visible too.</p></div>{studio.status === StudioStatus.awaiting_teacher_review ? <Clock3 aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}</div>
                {studio.submission ? <><div className="student-submission-recap"><article><span>Prediction</span><p>{studio.submission.prediction}</p></article><article><span>First version</span><p>{studio.submission.firstDraft}</p></article><article><span>Your critique</span><p>{studio.submission.selfCritique}</p></article><article><span>Revision</span><p>{studio.submission.revision}</p></article><article><span>Your reason</span><p>{studio.submission.explanation}</p></article><article><span>Reflection</span><p>{studio.submission.reflection}</p></article></div><div className="evidence-context-row"><span><strong>Chosen route:</strong> {plan.interestHooks[studio.submission.interestHookIndex]?.title ?? "Student choice"}</span><span><strong>Maker path:</strong> {plan.makerChoices.find((choice) => choice.id === studio.submission?.makerChoiceId)?.title ?? studio.submission.makerChoiceId}</span><span><strong>Opened support:</strong> {studio.submission.supportOpened ? "Yes" : "No"}</span></div></> : null}
                {studentHelp?.success ? <div className="completed-student-help"><div className="ai-thinking-heading"><Sparkles aria-hidden="true" /><span><strong>Creative questions you used</strong><small>These came after your first attempt. You still chose the test and wrote the revision.</small></span></div><div className="student-help-result"><p>{studentHelp.data.opening}</p><ol>{studentHelp.data.creativeSteps.map((creativeStep) => <li key={`${creativeStep.title}-${creativeStep.question}`}><span>{creativeStep.title}</span><strong>{creativeStep.question}</strong><p>{creativeStep.tryThis}</p><small>Source: {creativeStep.sourceSectionIds.join(", ")}</small></li>)}</ol><div className="student-help-self-check"><strong>Check it yourself</strong><p>{studentHelp.data.selfCheck}</p></div><small className="student-help-grounding">Grounded in {studentHelp.data.sourceSectionIds.join(", ")} · {studio.studentHelp?.promptVersion}</small></div></div> : null}
                <p className="privacy-inline-note">Only you and your assigned teacher can see this raw work. The parent and administrator views do not receive it.</p>
              </section>

              {studio.status === StudioStatus.awaiting_teacher_review ? null : <section className="portal-card student-feedback-card">
                <div className="card-heading-row"><div><p className="eyebrow">Teacher feedback</p><h2>Your next question is ready</h2></div><MessageCircleQuestion aria-hidden="true" /></div>
                {studio.teacherReview ? <><blockquote>{studio.teacherReview.studentFeedback}</blockquote><div className="next-question-callout"><span>Think next</span><strong>{studio.teacherReview.nextQuestion}</strong></div><p>The next studio will begin with <strong>{studio.teacherReview.nextScaffoldLevel}</strong> support. Your teacher made that decision from this activity.</p></> : <p>Your teacher is finishing the review.</p>}
              </section>}
            </>
          )}
        </div>
      )}
    </PortalChrome>
  );
}
