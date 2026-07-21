"use client";

import { BookOpenCheck, Link2, Plus, UserPlus } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import {
  connectSupportCircleAction,
  createCurriculumPackAction,
  createSchoolMemberAction,
  type AdminFormState,
} from "@/app/actions/admin";

const initialState: AdminFormState = { status: "idle" };

type MemberOption = { id: string; displayName: string };

function ResultMessage({ state }: { state: AdminFormState }) {
  return state.message ? (
    <p className={state.status === "success" ? "form-success" : "form-error"} role={state.status === "success" ? "status" : "alert"}>
      {state.message}
    </p>
  ) : null;
}

export function CreateMemberForm() {
  const [state, action, pending] = useActionState(createSchoolMemberAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form action={action} ref={formRef} className="admin-form">
      <div className="form-grid two-columns">
        <div className="field-group">
          <label htmlFor="memberName">Full name</label>
          <input id="memberName" name="displayName" autoComplete="off" minLength={2} maxLength={120} required />
        </div>
        <div className="field-group">
          <label htmlFor="memberRole">Role</label>
          <select id="memberRole" name="role" defaultValue="teacher">
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
          </select>
        </div>
      </div>
      <div className="form-grid two-columns">
        <div className="field-group">
          <label htmlFor="memberEmail">Sign-in email</label>
          <input id="memberEmail" name="email" type="email" autoComplete="off" maxLength={320} aria-invalid={Boolean(state.fieldErrors?.email)} required />
          {state.fieldErrors?.email?.[0] ? <span className="field-error">{state.fieldErrors.email[0]}</span> : null}
        </div>
        <div className="field-group">
          <label htmlFor="memberLocale">Preferred language</label>
          <select id="memberLocale" name="locale" defaultValue="en">
            <option value="en">English</option>
            <option value="ml">മലയാളം</option>
          </select>
        </div>
      </div>
      <label htmlFor="memberPassword">Temporary password</label>
      <input id="memberPassword" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
      <p className="field-help">Use 12 or more characters with uppercase, lowercase, and a number. Share it outside Kanni.</p>
      <ResultMessage state={state} />
      <button className="button primary" type="submit" disabled={pending}>
        <UserPlus aria-hidden="true" />{pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

export function ConnectSupportCircleForm({
  teachers,
  students,
  parents,
}: {
  teachers: MemberOption[];
  students: MemberOption[];
  parents: MemberOption[];
}) {
  const [state, action, pending] = useActionState(connectSupportCircleAction, initialState);
  const ready = teachers.length > 0 && students.length > 0 && parents.length > 0;
  return (
    <form action={action} className="admin-form support-circle-form">
      <div className="mapping-flow" aria-label="Support circle mapping">
        <label><span>Teacher</span><select name="teacherMembershipId" required disabled={!ready}><option value="">Choose teacher</option>{teachers.map((person) => <option key={person.id} value={person.id}>{person.displayName}</option>)}</select></label>
        <Plus aria-hidden="true" />
        <label><span>Student</span><select name="studentMembershipId" required disabled={!ready}><option value="">Choose student</option>{students.map((person) => <option key={person.id} value={person.id}>{person.displayName}</option>)}</select></label>
        <Plus aria-hidden="true" />
        <label><span>Parent</span><select name="guardianMembershipId" required disabled={!ready}><option value="">Choose parent</option>{parents.map((person) => <option key={person.id} value={person.id}>{person.displayName}</option>)}</select></label>
      </div>
      {!ready ? <p className="form-notice">Create at least one teacher, student, and parent account first.</p> : null}
      <ResultMessage state={state} />
      <button className="button secondary" type="submit" disabled={pending || !ready}>
        <Link2 aria-hidden="true" />{pending ? "Connecting…" : "Connect support circle"}
      </button>
    </form>
  );
}

export function CreateCurriculumPackForm() {
  const [state, action, pending] = useActionState(createCurriculumPackAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form action={action} ref={formRef} className="admin-form curriculum-admin-form">
      <div className="form-grid two-columns">
        <div className="field-group"><label htmlFor="curriculumTitle">Pack title</label><input id="curriculumTitle" name="title" minLength={4} maxLength={180} placeholder="School-authored ratio notes" required /></div>
        <div className="field-group"><label htmlFor="curriculumSubject">Subject</label><input id="curriculumSubject" name="subject" minLength={2} maxLength={80} placeholder="Mathematics" required /></div>
      </div>
      <div className="form-grid two-columns">
        <div className="field-group"><label htmlFor="curriculumGrade">Class</label><select id="curriculumGrade" name="gradeLabel" defaultValue="Class 7"><option>Class 6</option><option>Class 7</option><option>Class 8</option><option>Class 9</option></select></div>
        <div className="field-group"><label htmlFor="curriculumVersion">Version</label><input id="curriculumVersion" name="version" minLength={1} maxLength={40} placeholder="2026.1" required /></div>
      </div>
      <div className="form-grid two-columns">
        <div className="field-group"><label htmlFor="curriculumRights">Permission basis</label><select id="curriculumRights" name="rightsBasis" defaultValue="original"><option value="original">Original school content</option><option value="cc_by_4_0">CC BY 4.0</option><option value="public_domain">Public domain</option><option value="written_permission">Written permission</option></select></div>
        <div className="field-group"><label htmlFor="curriculumLocale">Content language</label><select id="curriculumLocale" name="locale" defaultValue="en"><option value="en">English</option><option value="ml">മലയാളം</option></select></div>
      </div>
      <label htmlFor="curriculumSourceUrl">Source link <span className="optional-label">optional</span></label>
      <input id="curriculumSourceUrl" name="sourceUrl" type="url" maxLength={500} placeholder="https://example.org/permission-safe-source" />
      {state.fieldErrors?.sourceUrl?.[0] ? <span className="field-error">{state.fieldErrors.sourceUrl[0]}</span> : null}
      <label htmlFor="curriculumSourceText">Curriculum text</label>
      <textarea id="curriculumSourceText" name="sourceText" rows={10} minLength={300} maxLength={30_000} placeholder={'Use a heading, then its content.\n\nStart each new section after a blank line.'} required />
      {state.fieldErrors?.sourceText?.[0] ? <span className="field-error">{state.fieldErrors.sourceText[0]}</span> : null}
      <p className="field-help">Kanni normalizes the text, creates checksummed sections, and keeps this version immutable after a studio uses it.</p>
      <label className="confirmation-check"><input type="checkbox" name="rightsConfirmed" value="yes" required /><span><strong>The school may copy and use this content.</strong><small>Public access alone is not permission. SCERT-hosted textbooks must remain link-only.</small></span></label>
      <ResultMessage state={state} />
      <button className="button primary" type="submit" disabled={pending}><BookOpenCheck aria-hidden="true" />{pending ? "Adding curriculum…" : "Add active curriculum pack"}</button>
    </form>
  );
}
