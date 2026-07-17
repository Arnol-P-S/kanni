import "server-only";

import { CycleStatus, Prisma, SchoolRole } from "@prisma/client";

import type { Actor } from "@/lib/auth";
import { db } from "@/lib/db";

const cyclePeopleInclude = {
  teacherMembership: {
    select: { id: true, user: { select: { displayName: true } } },
  },
  studentMembership: {
    select: { id: true, user: { select: { displayName: true } } },
  },
  guardianMembership: {
    select: { id: true, user: { select: { displayName: true } } },
  },
} satisfies Prisma.LearningCycleInclude;

export type LearningCycleWithPeople = Prisma.LearningCycleGetPayload<{
  include: typeof cyclePeopleInclude;
}>;

const parentCycleSelect = {
  goal: true,
  status: true,
  selectedSupport: true,
  nextSupport: true,
  makerPath: true,
  firstAnswer: true,
  revisedAnswer: true,
  familyResponse: true,
} satisfies Prisma.LearningCycleSelect;

const adminCycleSelect = {
  goal: true,
  status: true,
  title: true,
  familyLocale: true,
  scaffoldLevel: true,
  teacherMembership: {
    select: { user: { select: { displayName: true } } },
  },
  studentMembership: {
    select: { user: { select: { displayName: true } } },
  },
  guardianMembership: {
    select: { user: { select: { displayName: true } } },
  },
} satisfies Prisma.LearningCycleSelect;

export type ParentLearningCycleSummaryWithPeople = Prisma.LearningCycleGetPayload<{
  select: typeof parentCycleSelect;
}>;

type AdminLearningCycleSummaryWithPeople = Prisma.LearningCycleGetPayload<{
  select: typeof adminCycleSelect;
}>;

function cycleScope(actor: Actor): Prisma.LearningCycleWhereInput {
  const roleScope: Record<SchoolRole, Prisma.LearningCycleWhereInput> = {
    school_admin: {},
    teacher: { teacherMembershipId: actor.membershipId },
    student: { studentMembershipId: actor.membershipId },
    parent: { guardianMembershipId: actor.membershipId },
  };
  return {
    schoolId: actor.schoolId,
    status: { not: CycleStatus.archived },
    ...roleScope[actor.role],
  };
}

export async function getLearningCycleForActor(
  actor: Actor,
): Promise<LearningCycleWithPeople | null> {
  if (actor.role !== SchoolRole.teacher && actor.role !== SchoolRole.student) {
    return null;
  }
  return db.learningCycle.findFirst({
    where: cycleScope(actor),
    include: cyclePeopleInclude,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getLearningCycleSummaryForActor(
  actor: Actor,
): Promise<ParentLearningCycleSummaryWithPeople | null> {
  if (actor.role !== SchoolRole.parent) {
    return null;
  }
  return db.learningCycle.findFirst({
    where: cycleScope(actor),
    select: parentCycleSelect,
    orderBy: { updatedAt: "desc" },
  });
}

async function getAdminLearningCycleSummary(
  actor: Actor,
): Promise<AdminLearningCycleSummaryWithPeople | null> {
  if (actor.role !== SchoolRole.school_admin) return null;
  return db.learningCycle.findFirst({
    where: cycleScope(actor),
    select: adminCycleSelect,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getAdminWorkspace(actor: Actor) {
  if (actor.role !== SchoolRole.school_admin) return null;
  const [members, teacherLinks, guardianLinks, cycle, archivedCycleCount] =
    await Promise.all([
    db.membership.findMany({
      where: { schoolId: actor.schoolId, isActive: true },
      select: {
        id: true,
        role: true,
        user: {
          select: {
            displayName: true,
            email: true,
            locale: true,
            isActive: true,
          },
        },
      },
      orderBy: [{ role: "asc" }, { user: { displayName: "asc" } }],
    }),
    db.teacherStudent.count({
      where: { teacherMembership: { schoolId: actor.schoolId } },
    }),
    db.guardianStudent.count({
      where: { guardianMembership: { schoolId: actor.schoolId } },
    }),
      getAdminLearningCycleSummary(actor),
      db.learningCycle.count({
        where: { schoolId: actor.schoolId, status: CycleStatus.archived },
      }),
    ]);
  return {
    members,
    teacherLinks,
    guardianLinks,
    cycle,
    archivedCycleCount,
  };
}

export async function actorCanAccessCycle(
  actor: Actor,
  cycleId: string,
): Promise<boolean> {
  const count = await db.learningCycle.count({
    where: { id: cycleId, ...cycleScope(actor) },
  });
  return count === 1;
}
