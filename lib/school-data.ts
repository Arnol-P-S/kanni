import "server-only";

import { CurriculumStatus, Prisma, SchoolRole, StudioStatus } from "@prisma/client";

import type { Actor } from "@/lib/auth";
import { db } from "@/lib/db";

const personSelect = {
  id: true,
  displayName: true,
  email: true,
  locale: true,
  isActive: true,
} satisfies Prisma.UserSelect;

const teacherStudioInclude = {
  teacherMembership: { select: { id: true, user: { select: personSelect } } },
  studentMembership: { select: { id: true, user: { select: personSelect } } },
  guardianMembership: { select: { id: true, user: { select: personSelect } } },
  curriculumPack: {
    include: { sections: { orderBy: { position: "asc" as const } } },
  },
  submission: true,
  teacherReview: true,
  familyHandoff: true,
  studentHelp: true,
  aiRuns: { orderBy: { createdAt: "desc" as const }, take: 5 },
} satisfies Prisma.LearningStudioInclude;

const studentStudioInclude = {
  teacherMembership: {
    select: { id: true, user: { select: { displayName: true } } },
  },
  studentMembership: {
    select: { id: true, user: { select: { displayName: true } } },
  },
  curriculumPack: {
    select: {
      id: true,
      title: true,
      version: true,
      rightsBasis: true,
      sourceUrl: true,
      sections: {
        select: { referenceId: true, heading: true, content: true, position: true },
        orderBy: { position: "asc" as const },
      },
    },
  },
  submission: true,
  studentHelp: {
    select: {
      response: true,
      sourceSectionIds: true,
      model: true,
      promptVersion: true,
      createdAt: true,
    },
  },
  teacherReview: {
    select: {
      studentFeedback: true,
      nextQuestion: true,
      nextScaffoldLevel: true,
      createdAt: true,
    },
  },
} satisfies Prisma.LearningStudioInclude;

const parentStudioSelect = {
  id: true,
  title: true,
  subject: true,
  gradeLabel: true,
  goal: true,
  drivingQuestion: true,
  status: true,
  familyLocale: true,
  familyRespondedAt: true,
  updatedAt: true,
  teacherMembership: {
    select: { user: { select: { displayName: true } } },
  },
  studentMembership: {
    select: { user: { select: { displayName: true } } },
  },
  teacherReview: {
    select: {
      noticedStrength: true,
      nextQuestion: true,
      nextScaffoldLevel: true,
    },
  },
  familyHandoff: {
    select: { id: true, activity: true, response: true, parentNote: true, respondedAt: true },
  },
} satisfies Prisma.LearningStudioSelect;

const adminStudioSelect = {
  id: true,
  title: true,
  subject: true,
  gradeLabel: true,
  goal: true,
  status: true,
  updatedAt: true,
  teacherMembership: {
    select: { user: { select: { displayName: true } } },
  },
  studentMembership: {
    select: { user: { select: { displayName: true } } },
  },
  guardianMembership: {
    select: { user: { select: { displayName: true } } },
  },
  familyHandoff: { select: { response: true } },
} satisfies Prisma.LearningStudioSelect;

export type TeacherStudio = Prisma.LearningStudioGetPayload<{
  include: typeof teacherStudioInclude;
}>;
export type StudentStudio = Prisma.LearningStudioGetPayload<{
  include: typeof studentStudioInclude;
}>;
export type ParentStudio = Prisma.LearningStudioGetPayload<{
  select: typeof parentStudioSelect;
}>;
export type AdminStudioSummary = Prisma.LearningStudioGetPayload<{
  select: typeof adminStudioSelect;
}>;

export type PortalStudioSummary = {
  title: string;
  goal: string;
  status: StudioStatus;
};

export async function getTeacherWorkspace(actor: Actor, requestedStudioId?: string) {
  if (actor.role !== SchoolRole.teacher) return null;
  const studioScope: Prisma.LearningStudioWhereInput = {
    schoolId: actor.schoolId,
    teacherMembershipId: actor.membershipId,
    status: { not: StudioStatus.archived },
  };
  const selectedWhere = requestedStudioId
    ? { ...studioScope, id: requestedStudioId }
    : studioScope;

  const [assignments, studios, selectedStudio, aiUsage, curriculumPacks] = await Promise.all([
    db.teacherStudent.findMany({
      where: {
        teacherMembershipId: actor.membershipId,
        teacherMembership: { schoolId: actor.schoolId, isActive: true },
        studentMembership: { schoolId: actor.schoolId, isActive: true },
      },
      select: {
        studentMembership: {
          select: {
            id: true,
            user: { select: personSelect },
            studentGuardians: {
              select: {
                guardianMembership: {
                  select: { id: true, user: { select: personSelect } },
                },
              },
            },
          },
        },
      },
      orderBy: { studentMembership: { user: { displayName: "asc" } } },
    }),
    db.learningStudio.findMany({
      where: studioScope,
      select: {
        id: true,
        title: true,
        goal: true,
        status: true,
        scaffoldLevel: true,
        updatedAt: true,
        studentMembership: { select: { user: { select: { displayName: true } } } },
      },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
    db.learningStudio.findFirst({
      where: selectedWhere,
      include: teacherStudioInclude,
      orderBy: { updatedAt: "desc" },
    }),
    db.aiRun.aggregate({
      where: { schoolId: actor.schoolId, actorMembershipId: actor.membershipId },
      _count: { _all: true },
      _sum: { inputTokens: true, outputTokens: true, costMicros: true },
    }),
    db.curriculumPack.findMany({
      where: { schoolId: actor.schoolId, status: CurriculumStatus.active },
      select: {
        id: true,
        title: true,
        subject: true,
        gradeLabel: true,
        version: true,
        rightsBasis: true,
        checksum: true,
        _count: { select: { sections: true, studios: true } },
      },
      orderBy: [{ subject: "asc" }, { gradeLabel: "asc" }, { title: "asc" }],
    }),
  ]);

  return { assignments, studios, selectedStudio, aiUsage, curriculumPacks };
}

export async function getStudentStudio(actor: Actor): Promise<StudentStudio | null> {
  if (actor.role !== SchoolRole.student) return null;
  return db.learningStudio.findFirst({
    where: {
      schoolId: actor.schoolId,
      studentMembershipId: actor.membershipId,
      status: {
        in: [
          StudioStatus.ready_for_student,
          StudioStatus.awaiting_teacher_review,
          StudioStatus.ready_for_family,
          StudioStatus.complete,
        ],
      },
    },
    include: studentStudioInclude,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getParentStudio(actor: Actor): Promise<ParentStudio | null> {
  if (actor.role !== SchoolRole.parent) return null;
  return db.learningStudio.findFirst({
    where: {
      schoolId: actor.schoolId,
      guardianMembershipId: actor.membershipId,
      status: { in: [StudioStatus.ready_for_family, StudioStatus.complete] },
    },
    select: parentStudioSelect,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getAdminWorkspace(actor: Actor) {
  if (actor.role !== SchoolRole.school_admin) return null;
  const [members, teacherLinks, guardianLinks, studios, aiUsage, curriculumPacks] = await Promise.all([
    db.membership.findMany({
      where: { schoolId: actor.schoolId, isActive: true },
      select: { id: true, role: true, createdAt: true, user: { select: personSelect } },
      orderBy: [{ role: "asc" }, { user: { displayName: "asc" } }],
    }),
    db.teacherStudent.findMany({
      where: { teacherMembership: { schoolId: actor.schoolId } },
      select: {
        id: true,
        teacherMembership: { select: { id: true, user: { select: personSelect } } },
        studentMembership: { select: { id: true, user: { select: personSelect } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.guardianStudent.findMany({
      where: { guardianMembership: { schoolId: actor.schoolId } },
      select: {
        id: true,
        guardianMembership: { select: { id: true, user: { select: personSelect } } },
        studentMembership: { select: { id: true, user: { select: personSelect } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.learningStudio.findMany({
      where: { schoolId: actor.schoolId, status: { not: StudioStatus.archived } },
      select: adminStudioSelect,
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
    db.aiRun.aggregate({
      where: { schoolId: actor.schoolId },
      _count: { _all: true },
      _sum: { inputTokens: true, outputTokens: true, costMicros: true },
    }),
    db.curriculumPack.findMany({
      where: { schoolId: actor.schoolId },
      select: {
        id: true,
        title: true,
        subject: true,
        gradeLabel: true,
        version: true,
        rightsBasis: true,
        status: true,
        checksum: true,
        createdAt: true,
        createdByMembership: { select: { user: { select: { displayName: true } } } },
        _count: { select: { sections: true, studios: true } },
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    }),
  ]);

  return { members, teacherLinks, guardianLinks, studios, aiUsage, curriculumPacks };
}

export async function actorCanAccessStudio(actor: Actor, studioId: string): Promise<boolean> {
  const roleScope: Record<SchoolRole, Prisma.LearningStudioWhereInput> = {
    school_admin: { schoolId: actor.schoolId },
    teacher: { teacherMembershipId: actor.membershipId },
    student: { studentMembershipId: actor.membershipId },
    parent: { guardianMembershipId: actor.membershipId },
  };
  return (
    (await db.learningStudio.count({
      where: { id: studioId, schoolId: actor.schoolId, ...roleScope[actor.role] },
    })) === 1
  );
}
