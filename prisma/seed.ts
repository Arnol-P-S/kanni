import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import {
  AiStatus,
  ContentOrigin,
  FamilyResponse,
  Locale,
  PrismaClient,
  ReviewStatus,
  ScaffoldLevel,
  SchoolRole,
  SupportStrategy,
} from "@prisma/client";
import { hash } from "bcryptjs";

import {
  PROJECT_AUTHORED_PLAN,
  PROJECT_AUTHORED_SUPPORTS,
} from "../lib/growth-cycle";

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) throw new Error("DATABASE_URL is required for seeding.");

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

type SeedAccount = {
  role: SchoolRole;
  email: string;
  displayName: string;
  locale: Locale;
  passwordEnvironmentKey: string;
  localPassword: string;
};

const accounts: SeedAccount[] = [
  {
    role: SchoolRole.school_admin,
    email: "admin@kanni.local",
    displayName: "Anjali Menon",
    locale: Locale.en,
    passwordEnvironmentKey: "SEED_ADMIN_PASSWORD",
    localPassword: "Admin@Kanni2026",
  },
  {
    role: SchoolRole.teacher,
    email: "teacher@kanni.local",
    displayName: "Meera Joseph",
    locale: Locale.en,
    passwordEnvironmentKey: "SEED_TEACHER_PASSWORD",
    localPassword: "Teacher@Kanni2026",
  },
  {
    role: SchoolRole.student,
    email: "student@kanni.local",
    displayName: "Diya Nair",
    locale: Locale.ml,
    passwordEnvironmentKey: "SEED_STUDENT_PASSWORD",
    localPassword: "Student@Kanni2026",
  },
  {
    role: SchoolRole.parent,
    email: "parent@kanni.local",
    displayName: "Arun Nair",
    locale: Locale.ml,
    passwordEnvironmentKey: "SEED_PARENT_PASSWORD",
    localPassword: "Parent@Kanni2026",
  },
];

function passwordFor(account: SeedAccount): string {
  const configured = process.env[account.passwordEnvironmentKey]?.trim();
  if (configured) {
    if (configured.length < 12 || configured.length > 128) {
      throw new Error(
        `${account.passwordEnvironmentKey} must contain 12 to 128 characters.`,
      );
    }
    return configured;
  }
  if (process.env.KANNI_SEED_LOCAL_ACCOUNTS === "true") {
    return account.localPassword;
  }
  throw new Error(
    `${account.passwordEnvironmentKey} is required unless KANNI_SEED_LOCAL_ACCOUNTS=true.`,
  );
}

async function main(): Promise<void> {
  const school = await db.school.upsert({
    where: { slug: "kanni-community-school" },
    update: { name: "Kanni Community School", state: "Kerala" },
    create: {
      slug: "kanni-community-school",
      name: "Kanni Community School",
      state: "Kerala",
    },
  });

  const memberships = new Map<SchoolRole, { id: string; userId: string }>();
  for (const account of accounts) {
    const passwordHash = await hash(passwordFor(account), 12);
    const user = await db.user.upsert({
      where: { email: account.email },
      update: {
        displayName: account.displayName,
        passwordHash,
        locale: account.locale,
        isActive: true,
      },
      create: {
        email: account.email,
        displayName: account.displayName,
        passwordHash,
        locale: account.locale,
      },
    });
    const membership = await db.membership.upsert({
      where: {
        schoolId_userId_role: {
          schoolId: school.id,
          userId: user.id,
          role: account.role,
        },
      },
      update: { isActive: true },
      create: {
        schoolId: school.id,
        userId: user.id,
        role: account.role,
      },
    });
    memberships.set(account.role, { id: membership.id, userId: user.id });
  }

  const teacher = memberships.get(SchoolRole.teacher);
  const student = memberships.get(SchoolRole.student);
  const parent = memberships.get(SchoolRole.parent);
  if (!teacher || !student || !parent) {
    throw new Error("The teacher, student, and parent memberships are required.");
  }

  await db.teacherStudent.upsert({
    where: {
      teacherMembershipId_studentMembershipId: {
        teacherMembershipId: teacher.id,
        studentMembershipId: student.id,
      },
    },
    update: {},
    create: {
      teacherMembershipId: teacher.id,
      studentMembershipId: student.id,
    },
  });

  await db.guardianStudent.upsert({
    where: {
      guardianMembershipId_studentMembershipId: {
        guardianMembershipId: parent.id,
        studentMembershipId: student.id,
      },
    },
    update: {},
    create: {
      guardianMembershipId: parent.id,
      studentMembershipId: student.id,
    },
  });

  const support = PROJECT_AUTHORED_SUPPORTS.fraction_strips;
  await db.learningCycle.upsert({
    where: { id: "cycle-fractions-foundation" },
    update: {
      schoolId: school.id,
      teacherMembershipId: teacher.id,
      studentMembershipId: student.id,
      guardianMembershipId: parent.id,
    },
    create: {
      id: "cycle-fractions-foundation",
      schoolId: school.id,
      teacherMembershipId: teacher.id,
      studentMembershipId: student.id,
      guardianMembershipId: parent.id,
      title: "Seeing fractions as equal parts",
      subject: "Mathematics",
      gradeLabel: "Foundational learning",
      goal:
        "Compare one half and one quarter when both wholes are the same size.",
      familyLocale: Locale.ml,
      planOrigin: ContentOrigin.project_authored,
      aiStatus: AiStatus.not_requested,
      planSuccessCriteria: PROJECT_AUTHORED_PLAN.successCriteria,
      planLearningSequence: PROJECT_AUTHORED_PLAN.learningSequence,
      misconceptionIds: PROJECT_AUTHORED_PLAN.misconceptionIds,
      quickCheck: PROJECT_AUTHORED_PLAN.quickCheck,
      familyDraft: PROJECT_AUTHORED_PLAN.familyDraft,
      planAgencyMove: PROJECT_AUTHORED_PLAN.agencyMove,
      sourceSectionIds: PROJECT_AUTHORED_PLAN.sourceSectionIds,
      selectedSupport: SupportStrategy.fraction_strips,
      scaffoldLevel: ScaffoldLevel.guided,
      supportOrigin: ContentOrigin.project_authored,
      supportExplanation: support.explanation,
      supportThinkingPrompts: support.thinkingPrompts,
      supportHandoffPrompt: support.handoffPrompt,
      supportSourceIds: support.sourceSectionIds,
      teacherReviewStatus: ReviewStatus.pending,
      familyResponse: FamilyResponse.not_sent,
    },
  });
}

main()
  .then(async () => db.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error instanceof Error ? error.message : "Seed failed.");
    await db.$disconnect();
    process.exitCode = 1;
  });
