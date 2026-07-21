"use client";

import { ArrowLeft, ArrowRight, BookOpenCheck, CheckCircle2, UsersRound } from "lucide-react";
import { useActionState, useRef, useState } from "react";

import {
  createLearningStudioAction,
  type StudioFormState,
} from "@/app/actions/studio";

const initialState: StudioFormState = { status: "idle" };

type StudentOption = {
  id: string;
  displayName: string;
  parentName: string | null;
};

type CurriculumPackOption = {
  id: string;
  title: string;
  subject: string;
  gradeLabel: string;
  version: string;
  rightsBasis: string;
  sectionCount: number;
  studioCount: number;
};

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.[0] ? <span className="field-error">{errors[0]}</span> : null;
}

export function CreateStudioForm({
  students,
  curriculumPacks,
}: {
  students: StudentOption[];
  curriculumPacks: CurriculumPackOption[];
}) {
  const [state, action, pending] = useActionState(createLearningStudioAction, initialState);
  const [step, setStep] = useState(1);
  const [sourceMode, setSourceMode] = useState<"school_library" | "teacher_source">(
    curriculumPacks.length > 0 ? "school_library" : "teacher_source",
  );
  const [review, setReview] = useState({ learner: "", goal: "", source: "" });
  const formRef = useRef<HTMLFormElement>(null);

  function continueFrom(currentStep: number) {
    const form = formRef.current;
    if (!form || !form.reportValidity()) return;
    if (currentStep === 2) {
      const data = new FormData(form);
      const studentId = String(data.get("studentMembershipId") ?? "");
      setReview({
        learner: students.find((student) => student.id === studentId)?.displayName ?? "",
        goal: String(data.get("goal") ?? ""),
        source:
          sourceMode === "school_library"
            ? curriculumPacks.find((pack) => pack.id === data.get("curriculumPackId"))?.title ?? ""
            : String(data.get("packTitle") ?? ""),
      });
    }
    setStep(Math.min(3, currentStep + 1));
  }

  return (
    <form action={action} ref={formRef} className="studio-builder-form">
      <div className="builder-progress" aria-label="Learning studio setup">
        {[
          [1, "Learner and goal"],
          [2, "Curriculum source"],
          [3, "Review"],
        ].map(([number, label]) => (
          <div key={number} data-active={step === number} data-complete={step > Number(number)}>
            <span>{step > Number(number) ? <CheckCircle2 aria-hidden="true" /> : number}</span>
            <strong>{label}</strong>
          </div>
        ))}
      </div>

      <section hidden={step !== 1} className="builder-step" aria-labelledby="studio-step-one-title">
        <div className="form-section-heading"><UsersRound aria-hidden="true" /><div><span>Step 1 of 3</span><h3 id="studio-step-one-title">Choose the learner and the thinking goal</h3></div></div>
        {students.length === 0 ? <p className="form-error">No learner is assigned to you. Ask the school administrator to connect a support circle.</p> : null}
        <label htmlFor="studioStudent">Learner</label>
        <select id="studioStudent" name="studentMembershipId" defaultValue="" required={step === 1} disabled={students.length === 0}>
          <option value="">Choose learner</option>
          {students.map((student) => <option key={student.id} value={student.id}>{student.displayName}{student.parentName ? ` · family: ${student.parentName}` : " · parent not connected"}</option>)}
        </select>
        <FieldError errors={state.fieldErrors?.studentMembershipId} />
        <div className="form-grid two-columns">
          <div className="field-group"><label htmlFor="studioTitle">Studio title</label><input id="studioTitle" name="title" minLength={4} maxLength={160} placeholder="Ratios in everyday decisions" required={step === 1} /><FieldError errors={state.fieldErrors?.title} /></div>
          <div className="field-group"><label htmlFor="studioSubject">Subject</label><input id="studioSubject" name="subject" minLength={2} maxLength={80} placeholder="Mathematics" required={step === 1} /><FieldError errors={state.fieldErrors?.subject} /></div>
        </div>
        <div className="form-grid two-columns">
          <div className="field-group"><label htmlFor="studioGrade">Class</label><select id="studioGrade" name="gradeLabel" defaultValue="Class 7" required={step === 1}><option>Class 6</option><option>Class 7</option><option>Class 8</option><option>Class 9</option></select></div>
          <div className="field-group"><label htmlFor="familyLocale">Family activity language</label><select id="familyLocale" name="familyLocale" defaultValue="ml" required={step === 1}><option value="ml">മലയാളം</option><option value="en">English</option></select></div>
        </div>
        <label htmlFor="studioGoal">Learning goal</label>
        <textarea id="studioGoal" name="goal" rows={3} minLength={20} maxLength={320} placeholder="Compare equivalent ratios and justify the comparison with a table or model." required={step === 1} />
        <FieldError errors={state.fieldErrors?.goal} />
        <label htmlFor="drivingQuestion">Driving question</label>
        <textarea id="drivingQuestion" name="drivingQuestion" rows={2} minLength={15} maxLength={300} placeholder="How can we prove that two ratios describe the same relationship?" required={step === 1} />
        <FieldError errors={state.fieldErrors?.drivingQuestion} />
        <div className="builder-actions"><span /><button className="button primary" type="button" onClick={() => continueFrom(1)} disabled={students.length === 0}>Continue to source<ArrowRight aria-hidden="true" /></button></div>
      </section>

      <section hidden={step !== 2} className="builder-step" aria-labelledby="studio-step-two-title">
        <div className="form-section-heading"><BookOpenCheck aria-hidden="true" /><div><span>Step 2 of 3</span><h3 id="studio-step-two-title">Add curriculum Kanni is allowed to use</h3></div></div>
        <fieldset className="source-mode-options"><legend>Choose where the curriculum comes from</legend><label><input type="radio" name="sourceMode" value="school_library" checked={sourceMode === "school_library"} onChange={() => setSourceMode("school_library")} disabled={curriculumPacks.length === 0} /><span><strong>School curriculum library</strong><small>Reuse an active, checksummed pack managed by the administrator.</small></span></label><label><input type="radio" name="sourceMode" value="teacher_source" checked={sourceMode === "teacher_source"} onChange={() => setSourceMode("teacher_source")} /><span><strong>Add my own source</strong><small>Create an immutable teacher-owned pack for this studio.</small></span></label></fieldset>
        {sourceMode === "school_library" ? (
          <div className="library-source-picker">
            <label htmlFor="curriculumPackId">Active curriculum pack</label>
            <select id="curriculumPackId" name="curriculumPackId" defaultValue="" required={step === 2}><option value="">Choose a pack</option>{curriculumPacks.map((pack) => <option key={pack.id} value={pack.id}>{pack.title} · {pack.subject} · {pack.gradeLabel} · {pack.version}</option>)}</select>
            <FieldError errors={state.fieldErrors?.curriculumPackId} />
            <p className="field-help">The studio subject and class must match the selected pack. Only relevant sections will be sent for an explicit AI request.</p>
          </div>
        ) : (
          <>
            <input type="hidden" name="curriculumPackId" value="" />
            <div className="rights-callout"><strong>Public access is not copying permission.</strong><p>Paste only your own lesson notes, CC BY 4.0 or public-domain material, or content you have written permission to use. SCERT-hosted textbooks must remain link-only.</p></div>
            <div className="form-grid two-columns">
              <div className="field-group"><label htmlFor="packTitle">Source title</label><input id="packTitle" name="packTitle" minLength={4} maxLength={180} placeholder="Teacher-authored ratio notes" required={step === 2} /><FieldError errors={state.fieldErrors?.packTitle} /></div>
              <div className="field-group"><label htmlFor="packVersion">Version</label><input id="packVersion" name="packVersion" minLength={1} maxLength={40} placeholder="2026.1" required={step === 2} /></div>
            </div>
            <label htmlFor="rightsBasis">Permission basis</label>
            <select id="rightsBasis" name="rightsBasis" defaultValue="original" required={step === 2}><option value="original">Original teacher or school content</option><option value="cc_by_4_0">CC BY 4.0</option><option value="public_domain">Public domain</option><option value="written_permission">Written permission</option></select>
            <label htmlFor="sourceUrl">Source link <span className="optional-label">optional</span></label>
            <input id="sourceUrl" name="sourceUrl" type="url" maxLength={500} placeholder="https://example.org/permission-safe-source" />
            <FieldError errors={state.fieldErrors?.sourceUrl} />
            <label htmlFor="sourceText">Curriculum text</label>
            <textarea id="sourceText" name="sourceText" rows={12} minLength={300} maxLength={30000} placeholder={'Use a short heading, then the source content.\n\nAdd a blank line before the next section.'} required={step === 2} />
            <FieldError errors={state.fieldErrors?.sourceText} />
            <p className="field-help">Kanni divides this text into checksummed sections. Only relevant sections are sent when the teacher requests an AI plan.</p>
          </>
        )}
        <div className="builder-actions"><button className="button quiet" type="button" onClick={() => setStep(1)}><ArrowLeft aria-hidden="true" />Back</button><button className="button primary" type="button" onClick={() => continueFrom(2)}>Review studio<ArrowRight aria-hidden="true" /></button></div>
      </section>

      <section hidden={step !== 3} className="builder-step" aria-labelledby="studio-step-three-title">
        <div className="form-section-heading"><CheckCircle2 aria-hidden="true" /><div><span>Step 3 of 3</span><h3 id="studio-step-three-title">Check the handoff before creating it</h3></div></div>
        <dl className="builder-review-list"><div><dt>Learner</dt><dd>{review.learner}</dd></div><div><dt>Goal</dt><dd>{review.goal}</dd></div><div><dt>Curriculum source</dt><dd>{review.source}</dd></div><div><dt>AI use</dt><dd>None yet. Creating a studio does not call OpenRouter.</dd></div></dl>
        {sourceMode === "teacher_source" ? <label className="confirmation-check"><input type="checkbox" name="rightsConfirmed" value="yes" required={step === 3} /><span><strong>I am allowed to copy this source into Kanni.</strong><small>I understand that a public textbook link alone does not grant this permission.</small></span></label> : <div className="confirmation-check library-confirmation"><CheckCircle2 aria-hidden="true" /><span><strong>The selected pack is managed by the school.</strong><small>A new studio links to that immutable version. It does not duplicate or rewrite the source.</small></span></div>}
        {state.message ? <p className="form-error" role="alert">{state.message}</p> : null}
        <div className="builder-actions"><button className="button quiet" type="button" onClick={() => setStep(2)}><ArrowLeft aria-hidden="true" />Back</button><button className="button primary" type="submit" disabled={pending}>{pending ? "Creating studio…" : "Create planning studio"}<ArrowRight aria-hidden="true" /></button></div>
      </section>
    </form>
  );
}
