import { CurriculumStatus, SchoolRole } from "@prisma/client";
import type { Metadata } from "next";
import {
  Bot,
  BookOpenCheck,
  CheckCircle2,
  CircleDashed,
  FileArchive,
  Link2,
  Network,
  ShieldCheck,
  Undo2,
  UserPlus,
  UsersRound,
} from "lucide-react";

import {
  ConnectSupportCircleForm,
  CreateCurriculumPackForm,
  CreateMemberForm,
} from "@/components/admin-forms";
import { setCurriculumPackStatusAction } from "@/app/actions/admin";
import { PortalChrome, studioStageLabel } from "@/components/portal-chrome";
import { getStudioAiCapability } from "@/lib/ai/studio-ai";
import { requireActor } from "@/lib/auth";
import { getAdminWorkspace } from "@/lib/school-data";

export const metadata: Metadata = { title: "School workspace" };

const roleLabels = {
  school_admin: "School administrator",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
} as const;

export default async function AdminPortalPage() {
  const actor = await requireActor(SchoolRole.school_admin);
  const workspace = await getAdminWorkspace(actor);
  if (!workspace) return null;
  const ai = getStudioAiCapability();
  const teachers = workspace.members
    .filter((member) => member.role === SchoolRole.teacher)
    .map((member) => ({ id: member.id, displayName: member.user.displayName }));
  const students = workspace.members
    .filter((member) => member.role === SchoolRole.student)
    .map((member) => ({ id: member.id, displayName: member.user.displayName }));
  const parents = workspace.members
    .filter((member) => member.role === SchoolRole.parent)
    .map((member) => ({ id: member.id, displayName: member.user.displayName }));
  const latestStudio = workspace.studios[0] ?? null;
  const completedSetupSteps = [
    workspace.members.some((member) => member.role !== SchoolRole.school_admin),
    workspace.teacherLinks.length > 0 && workspace.guardianLinks.length > 0,
    workspace.curriculumPacks.some((pack) => pack.status === CurriculumStatus.active),
    workspace.studios.length > 0,
  ];

  return (
    <PortalChrome
      actor={actor}
      studio={latestStudio}
      title="Build the support circle, then let teachers lead"
      intro="Create real role accounts, connect the people responsible for each learner, and monitor learning work without opening private student submissions."
    >
      <div className="workspace-grid admin-workspace-grid">
        <section className="portal-card onboarding-strip" aria-labelledby="school-onboarding-title">
          <div className="card-heading-row">
            <div><p className="eyebrow">School setup</p><h2 id="school-onboarding-title">Four steps to the first learning studio</h2></div>
            <span className="status-badge">{completedSetupSteps.filter(Boolean).length} of 4 ready</span>
          </div>
          <ol className="onboarding-steps">
            {[
              ["Create role accounts", "Add the teacher, student, and parent who will use Kanni."],
              ["Connect the support circle", "Map one teacher and parent to each student."],
              ["Approve curriculum", "Add one versioned, permission-safe school curriculum pack."],
              ["Teacher builds a studio", "The teacher chooses a learner, goal, and active curriculum pack."],
            ].map(([title, detail], index) => (
              <li key={title} data-complete={completedSetupSteps[index]}>
                <span>{completedSetupSteps[index] ? <CheckCircle2 aria-hidden="true" /> : index + 1}</span>
                <div><strong>{title}</strong><small>{detail}</small></div>
              </li>
            ))}
          </ol>
        </section>

        <section className="portal-card metric-card-row" aria-label="School connection summary">
          <article><UsersRound aria-hidden="true" /><strong>{workspace.members.length}</strong><span>Active people</span></article>
          <article><Link2 aria-hidden="true" /><strong>{workspace.teacherLinks.length}</strong><span>Teacher-student links</span></article>
          <article><Network aria-hidden="true" /><strong>{workspace.guardianLinks.length}</strong><span>Parent-student links</span></article>
          <article><CircleDashed aria-hidden="true" /><strong>{workspace.studios.length}</strong><span>Learning studios</span></article>
        </section>

        <section className="portal-card admin-create-card" aria-labelledby="create-account-title">
          <div className="card-heading-row"><div><p className="eyebrow">People and access</p><h2 id="create-account-title">Create a role account</h2><p>The administrator sets the first password. Kanni never displays it again.</p></div><UserPlus aria-hidden="true" /></div>
          <CreateMemberForm />
        </section>

        <section className="portal-card admin-map-card" aria-labelledby="connect-circle-title">
          <div className="card-heading-row"><div><p className="eyebrow">Responsibility mapping</p><h2 id="connect-circle-title">Connect a support circle</h2><p>This mapping controls who can plan, submit work, review evidence, and receive the family activity.</p></div><Link2 aria-hidden="true" /></div>
          <ConnectSupportCircleForm teachers={teachers} students={students} parents={parents} />
        </section>

        <section className="portal-card admin-curriculum-card" aria-labelledby="curriculum-library-title">
          <div className="card-heading-row"><div><p className="eyebrow">Curriculum governance</p><h2 id="curriculum-library-title">Manage the school curriculum library</h2><p>Add an approved version once, then let teachers reuse it. Packs are immutable after use; archive an old version and add a new one instead of rewriting past learning records.</p></div><BookOpenCheck aria-hidden="true" /></div>
          <CreateCurriculumPackForm />
          <div className="curriculum-admin-list" aria-label="Curriculum packs">
            {workspace.curriculumPacks.length === 0 ? <p className="empty-copy">No curriculum pack yet. Add the first permission-safe source above.</p> : workspace.curriculumPacks.map((pack) => (
              <article key={pack.id}>
                <div><span className={`status-badge ${pack.status === CurriculumStatus.active ? "success" : "attention"}`}>{pack.status}</span><h3>{pack.title}</h3><p>{pack.subject} · {pack.gradeLabel} · version {pack.version}</p><small>{pack._count.sections} checksummed sections · used by {pack._count.studios} studios · {pack.rightsBasis.replaceAll("_", " ")} · added by {pack.createdByMembership.user.displayName}</small><code title={pack.checksum}>{pack.checksum.slice(0, 12)}…</code></div>
                <form action={setCurriculumPackStatusAction}><input type="hidden" name="packId" value={pack.id} /><input type="hidden" name="nextStatus" value={pack.status === CurriculumStatus.active ? "archived" : "active"} /><button className="button compact secondary" type="submit">{pack.status === CurriculumStatus.active ? <FileArchive aria-hidden="true" /> : <Undo2 aria-hidden="true" />}{pack.status === CurriculumStatus.active ? "Archive version" : "Restore version"}</button></form>
              </article>
            ))}
          </div>
        </section>

        <section className="portal-card permission-map-card" aria-labelledby="permission-map-title">
          <div className="card-heading-row"><div><p className="eyebrow">Role permissions</p><h2 id="permission-map-title">Each role edits and submits only its part</h2></div><ShieldCheck aria-hidden="true" /></div>
          <div className="permission-role-grid"><article><strong>Administrator</strong><p>Manage accounts, support-circle mappings, and versioned curriculum. See workflow and AI usage, not raw learner work.</p></article><article><strong>Teacher</strong><p>Create and edit plans, request one grounded AI draft, publish activities, and review submitted evidence.</p></article><article><strong>Student</strong><p>Edit work before submission, request one creative thinking coach after a first attempt, and submit only their assigned activity.</p></article><article><strong>Parent</strong><p>Read the reviewed home activity, edit a response before sending, and submit it to the assigned teacher.</p></article></div>
        </section>

        <section className="portal-card people-card" aria-labelledby="school-accounts-title">
          <div className="card-heading-row"><div><p className="eyebrow">Current access</p><h2 id="school-accounts-title">School accounts</h2></div><span className="status-badge success">{workspace.members.length} active</span></div>
          {workspace.members.length > 0 ? (
            <div className="table-wrap" tabIndex={0}>
              <table>
                <caption className="sr-only">Active school accounts</caption>
                <thead><tr><th>Person</th><th>Role</th><th>Sign-in email</th><th>Language</th></tr></thead>
                <tbody>{workspace.members.map((member) => <tr key={member.id}><td><strong>{member.user.displayName}</strong></td><td>{roleLabels[member.role]}</td><td>{member.user.email}</td><td>{member.user.locale === "ml" ? "മലയാളം" : "English"}</td></tr>)}</tbody>
              </table>
            </div>
          ) : <p>No accounts have been added.</p>}
        </section>

        <section className="portal-card mapping-card" aria-labelledby="mapped-circles-title">
          <div className="card-heading-row"><div><p className="eyebrow">Connected responsibility</p><h2 id="mapped-circles-title">Support circles</h2></div></div>
          {workspace.teacherLinks.length === 0 ? <p className="empty-copy">No teacher-student mapping yet. Use the form above after creating all three roles.</p> : (
            <div className="support-circle-rows">
              {workspace.teacherLinks.map((teacherLink) => {
                const parentLink = workspace.guardianLinks.find((link) => link.studentMembership.id === teacherLink.studentMembership.id);
                return <article key={teacherLink.id}><span><small>Teacher</small><strong>{teacherLink.teacherMembership.user.displayName}</strong></span><Link2 aria-hidden="true" /><span><small>Student</small><strong>{teacherLink.studentMembership.user.displayName}</strong></span><Link2 aria-hidden="true" /><span><small>Parent</small><strong>{parentLink?.guardianMembership.user.displayName ?? "Not connected"}</strong></span></article>;
              })}
            </div>
          )}
        </section>

        <section className="portal-card studio-board-card" aria-labelledby="school-studios-title">
          <div className="card-heading-row"><div><p className="eyebrow">Learning operations</p><h2 id="school-studios-title">Studio handoffs</h2><p>Administrators see workflow status, not raw learner work.</p></div></div>
          {workspace.studios.length === 0 ? <p className="empty-copy">A mapped teacher can now sign in and create the first studio.</p> : (
            <div className="studio-board-list">{workspace.studios.map((studio) => <article key={studio.id}><div><strong>{studio.title}</strong><small>{studio.subject} · {studio.gradeLabel}</small></div><div><span>{studio.studentMembership.user.displayName}</span><small>with {studio.teacherMembership.user.displayName}</small></div><span className="status-badge">{studioStageLabel(studio.status, actor.locale)}</span></article>)}</div>
          )}
        </section>

        <section className="portal-card ai-operations-card" aria-labelledby="ai-operations-title">
          <div className="card-heading-row"><div><p className="eyebrow">AI operations</p><h2 id="ai-operations-title">Explicit teacher plans and student thinking help</h2></div><span className={`status-badge ${ai.available ? "success" : "attention"}`}><Bot aria-hidden="true" />{ai.available ? "Available" : "Off"}</span></div>
          <div className="ai-operations-grid">
            <article><strong>{workspace.aiUsage._count._all}</strong><span>Recorded AI requests</span></article>
            <article><strong>{(workspace.aiUsage._sum.inputTokens ?? 0).toLocaleString()}</strong><span>Input tokens</span></article>
            <article><strong>{(workspace.aiUsage._sum.outputTokens ?? 0).toLocaleString()}</strong><span>Output tokens</span></article>
            <article><strong>${((workspace.aiUsage._sum.costMicros ?? 0) / 1_000_000).toFixed(4)}</strong><span>Recorded provider cost</span></article>
          </div>
          <div className="governance-list compact-governance">
            <div><ShieldCheck aria-hidden="true" /><span><strong>No automatic requests</strong><small>A teacher or student must press the relevant button. Each request type can be claimed once per studio.</small></span></div>
            <div><ShieldCheck aria-hidden="true" /><span><strong>Separate bounded contexts</strong><small>Teacher planning excludes learner work. Student help sends only the first attempt and up to four relevant curriculum sections.</small></span></div>
            <div><ShieldCheck aria-hidden="true" /><span><strong>Invalid citations are hidden</strong><small>If a generated section ID is not in the retrieved source, the teacher keeps the local starting plan.</small></span></div>
          </div>
        </section>
      </div>
    </PortalChrome>
  );
}
