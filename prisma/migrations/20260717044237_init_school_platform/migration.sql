-- CreateEnum
CREATE TYPE "SchoolRole" AS ENUM ('school_admin', 'teacher', 'student', 'parent');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('en', 'ml');

-- CreateEnum
CREATE TYPE "CycleStatus" AS ENUM ('draft', 'active', 'waiting_teacher_review', 'waiting_family', 'complete');

-- CreateEnum
CREATE TYPE "ContentOrigin" AS ENUM ('project_authored', 'gpt_5_6');

-- CreateEnum
CREATE TYPE "AiStatus" AS ENUM ('not_requested', 'ready', 'unavailable');

-- CreateEnum
CREATE TYPE "SupportStrategy" AS ENUM ('fraction_strips', 'guided_questions', 'explain_to_someone');

-- CreateEnum
CREATE TYPE "FractionAnswer" AS ENUM ('one_half', 'one_quarter');

-- CreateEnum
CREATE TYPE "ExplanationChoice" AS ENUM ('same_whole_more_equal_parts', 'four_is_bigger', 'not_sure');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'reviewed');

-- CreateEnum
CREATE TYPE "FamilyResponse" AS ENUM ('not_sent', 'tried', 'need_another_idea', 'contact_teacher');

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "state" VARCHAR(80) NOT NULL DEFAULT 'Kerala',
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "displayName" VARCHAR(120) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "locale" "Locale" NOT NULL DEFAULT 'en',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "SchoolRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherStudent" (
    "id" TEXT NOT NULL,
    "teacherMembershipId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianStudent" (
    "id" TEXT NOT NULL,
    "guardianMembershipId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardianStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "userId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginThrottle" (
    "keyHash" VARCHAR(64) NOT NULL,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginThrottle_pkey" PRIMARY KEY ("keyHash")
);

-- CreateTable
CREATE TABLE "LearningCycle" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "teacherMembershipId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "guardianMembershipId" TEXT,
    "title" VARCHAR(180) NOT NULL,
    "subject" VARCHAR(80) NOT NULL,
    "gradeLabel" VARCHAR(40) NOT NULL,
    "goal" VARCHAR(320) NOT NULL,
    "status" "CycleStatus" NOT NULL DEFAULT 'draft',
    "familyLocale" "Locale" NOT NULL DEFAULT 'ml',
    "planOrigin" "ContentOrigin" NOT NULL DEFAULT 'project_authored',
    "aiStatus" "AiStatus" NOT NULL DEFAULT 'not_requested',
    "planSuccessCriteria" JSONB NOT NULL,
    "planLearningSequence" JSONB NOT NULL,
    "misconceptionIds" JSONB NOT NULL,
    "quickCheck" VARCHAR(500) NOT NULL,
    "familyDraft" VARCHAR(700) NOT NULL,
    "sourceSectionIds" JSONB NOT NULL,
    "selectedSupport" "SupportStrategy" NOT NULL DEFAULT 'fraction_strips',
    "firstAnswer" "FractionAnswer",
    "supportUsed" BOOLEAN NOT NULL DEFAULT false,
    "supportOrigin" "ContentOrigin" NOT NULL DEFAULT 'project_authored',
    "supportExplanation" VARCHAR(700) NOT NULL,
    "supportSourceIds" JSONB NOT NULL,
    "revisedAnswer" "FractionAnswer",
    "explanationChoice" "ExplanationChoice",
    "disagreedWithRecord" BOOLEAN NOT NULL DEFAULT false,
    "teacherReviewStatus" "ReviewStatus" NOT NULL DEFAULT 'pending',
    "nextSupport" "SupportStrategy",
    "familyBriefApproved" BOOLEAN NOT NULL DEFAULT false,
    "familyResponse" "FamilyResponse" NOT NULL DEFAULT 'not_sent',
    "version" INTEGER NOT NULL DEFAULT 1,
    "publishedAt" TIMESTAMP(3),
    "evidenceSubmittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "familyRespondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" VARCHAR(80) NOT NULL,
    "entityType" VARCHAR(80) NOT NULL,
    "entityId" VARCHAR(120) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_slug_key" ON "School"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "Membership_schoolId_role_isActive_idx" ON "Membership"("schoolId", "role", "isActive");

-- CreateIndex
CREATE INDEX "Membership_userId_isActive_idx" ON "Membership"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_schoolId_userId_role_key" ON "Membership"("schoolId", "userId", "role");

-- CreateIndex
CREATE INDEX "TeacherStudent_studentMembershipId_idx" ON "TeacherStudent"("studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherStudent_teacherMembershipId_studentMembershipId_key" ON "TeacherStudent"("teacherMembershipId", "studentMembershipId");

-- CreateIndex
CREATE INDEX "GuardianStudent_studentMembershipId_idx" ON "GuardianStudent"("studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "GuardianStudent_guardianMembershipId_studentMembershipId_key" ON "GuardianStudent"("guardianMembershipId", "studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "Session_membershipId_expiresAt_idx" ON "Session"("membershipId", "expiresAt");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "LoginThrottle_resetAt_idx" ON "LoginThrottle"("resetAt");

-- CreateIndex
CREATE INDEX "LearningCycle_schoolId_status_updatedAt_idx" ON "LearningCycle"("schoolId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "LearningCycle_teacherMembershipId_status_idx" ON "LearningCycle"("teacherMembershipId", "status");

-- CreateIndex
CREATE INDEX "LearningCycle_studentMembershipId_status_idx" ON "LearningCycle"("studentMembershipId", "status");

-- CreateIndex
CREATE INDEX "LearningCycle_guardianMembershipId_status_idx" ON "LearningCycle"("guardianMembershipId", "status");

-- CreateIndex
CREATE INDEX "AuditEvent_schoolId_createdAt_idx" ON "AuditEvent"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_createdAt_idx" ON "AuditEvent"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorUserId_createdAt_idx" ON "AuditEvent"("actorUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherStudent" ADD CONSTRAINT "TeacherStudent_teacherMembershipId_fkey" FOREIGN KEY ("teacherMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherStudent" ADD CONSTRAINT "TeacherStudent_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianStudent" ADD CONSTRAINT "GuardianStudent_guardianMembershipId_fkey" FOREIGN KEY ("guardianMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianStudent" ADD CONSTRAINT "GuardianStudent_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningCycle" ADD CONSTRAINT "LearningCycle_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningCycle" ADD CONSTRAINT "LearningCycle_teacherMembershipId_fkey" FOREIGN KEY ("teacherMembershipId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningCycle" ADD CONSTRAINT "LearningCycle_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningCycle" ADD CONSTRAINT "LearningCycle_guardianMembershipId_fkey" FOREIGN KEY ("guardianMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
