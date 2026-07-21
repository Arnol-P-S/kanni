-- Retire the fractions-specific prototype record. It contained only synthetic review data.
DROP TABLE "LearningCycle";

-- Keep the provider provenance enum, but use a product-neutral teacher-authored label.
ALTER TYPE "ContentOrigin" RENAME VALUE 'project_authored' TO 'teacher_authored';
ALTER TYPE "AiStatus" ADD VALUE IF NOT EXISTS 'rejected';

DROP TYPE "CycleStatus";
DROP TYPE "SupportStrategy";
DROP TYPE "MakerPath";
DROP TYPE "ArtifactCritique";
DROP TYPE "FractionAnswer";
DROP TYPE "ExplanationChoice";
DROP TYPE "ReviewStatus";

CREATE TYPE "RightsBasis" AS ENUM ('original', 'cc_by_4_0', 'public_domain', 'written_permission');
CREATE TYPE "StudioStatus" AS ENUM ('planning', 'ready_for_student', 'awaiting_teacher_review', 'ready_for_family', 'complete', 'archived');
CREATE TYPE "AiRunStatus" AS ENUM ('succeeded', 'rejected', 'provider_error');

CREATE TABLE "CurriculumPack" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdByMembershipId" TEXT NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "subject" VARCHAR(80) NOT NULL,
    "gradeLabel" VARCHAR(40) NOT NULL,
    "version" VARCHAR(40) NOT NULL,
    "rightsBasis" "RightsBasis" NOT NULL,
    "sourceUrl" VARCHAR(500),
    "locale" "Locale" NOT NULL DEFAULT 'en',
    "checksum" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurriculumPack_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CurriculumSection" (
    "id" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "referenceId" VARCHAR(12) NOT NULL,
    "heading" VARCHAR(160) NOT NULL,
    "content" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CurriculumSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearningStudio" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "teacherMembershipId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "guardianMembershipId" TEXT,
    "curriculumPackId" TEXT NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "subject" VARCHAR(80) NOT NULL,
    "gradeLabel" VARCHAR(40) NOT NULL,
    "goal" VARCHAR(320) NOT NULL,
    "drivingQuestion" VARCHAR(300) NOT NULL,
    "status" "StudioStatus" NOT NULL DEFAULT 'planning',
    "familyLocale" "Locale" NOT NULL DEFAULT 'ml',
    "planOrigin" "ContentOrigin" NOT NULL DEFAULT 'teacher_authored',
    "aiStatus" "AiStatus" NOT NULL DEFAULT 'not_requested',
    "plan" JSONB NOT NULL,
    "planPromptVersion" VARCHAR(60) NOT NULL DEFAULT 'teacher-starter-v1',
    "aiModel" VARCHAR(120),
    "scaffoldLevel" "ScaffoldLevel" NOT NULL DEFAULT 'guided',
    "version" INTEGER NOT NULL DEFAULT 1,
    "planReviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "evidenceSubmittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "familyRespondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningStudio_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearnerSubmission" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "interestHookIndex" INTEGER NOT NULL,
    "makerChoiceId" VARCHAR(48) NOT NULL,
    "prediction" TEXT NOT NULL,
    "firstDraft" TEXT NOT NULL,
    "selfCritique" TEXT NOT NULL,
    "revision" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "reflection" TEXT NOT NULL,
    "supportOpened" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TeacherReview" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "teacherMembershipId" TEXT NOT NULL,
    "noticedStrength" VARCHAR(500) NOT NULL,
    "studentFeedback" VARCHAR(700) NOT NULL,
    "nextQuestion" VARCHAR(300) NOT NULL,
    "nextScaffoldLevel" "ScaffoldLevel" NOT NULL,
    "familyActivity" VARCHAR(700) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FamilyHandoff" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "activity" VARCHAR(700) NOT NULL,
    "response" "FamilyResponse" NOT NULL DEFAULT 'not_sent',
    "parentNote" VARCHAR(400),
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyHandoff_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiRun" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "actorMembershipId" TEXT NOT NULL,
    "purpose" VARCHAR(60) NOT NULL,
    "provider" VARCHAR(40) NOT NULL,
    "model" VARCHAR(120) NOT NULL,
    "status" "AiRunStatus" NOT NULL,
    "promptVersion" VARCHAR(60) NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "costMicros" INTEGER,
    "latencyMs" INTEGER NOT NULL,
    "errorCode" VARCHAR(60),
    "citationIds" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CurriculumPack_schoolId_subject_gradeLabel_idx" ON "CurriculumPack"("schoolId", "subject", "gradeLabel");
CREATE INDEX "CurriculumPack_createdByMembershipId_createdAt_idx" ON "CurriculumPack"("createdByMembershipId", "createdAt");
CREATE UNIQUE INDEX "CurriculumSection_packId_referenceId_key" ON "CurriculumSection"("packId", "referenceId");
CREATE UNIQUE INDEX "CurriculumSection_packId_position_key" ON "CurriculumSection"("packId", "position");
CREATE INDEX "CurriculumSection_packId_position_idx" ON "CurriculumSection"("packId", "position");
CREATE INDEX "LearningStudio_schoolId_status_updatedAt_idx" ON "LearningStudio"("schoolId", "status", "updatedAt");
CREATE INDEX "LearningStudio_teacherMembershipId_status_updatedAt_idx" ON "LearningStudio"("teacherMembershipId", "status", "updatedAt");
CREATE INDEX "LearningStudio_studentMembershipId_status_updatedAt_idx" ON "LearningStudio"("studentMembershipId", "status", "updatedAt");
CREATE INDEX "LearningStudio_guardianMembershipId_status_updatedAt_idx" ON "LearningStudio"("guardianMembershipId", "status", "updatedAt");
CREATE INDEX "LearningStudio_curriculumPackId_idx" ON "LearningStudio"("curriculumPackId");
CREATE UNIQUE INDEX "LearnerSubmission_studioId_key" ON "LearnerSubmission"("studioId");
CREATE UNIQUE INDEX "TeacherReview_studioId_key" ON "TeacherReview"("studioId");
CREATE INDEX "TeacherReview_teacherMembershipId_createdAt_idx" ON "TeacherReview"("teacherMembershipId", "createdAt");
CREATE UNIQUE INDEX "FamilyHandoff_studioId_key" ON "FamilyHandoff"("studioId");
CREATE INDEX "AiRun_schoolId_createdAt_idx" ON "AiRun"("schoolId", "createdAt");
CREATE INDEX "AiRun_studioId_createdAt_idx" ON "AiRun"("studioId", "createdAt");
CREATE INDEX "AiRun_actorMembershipId_createdAt_idx" ON "AiRun"("actorMembershipId", "createdAt");

ALTER TABLE "CurriculumPack" ADD CONSTRAINT "CurriculumPack_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CurriculumPack" ADD CONSTRAINT "CurriculumPack_createdByMembershipId_fkey" FOREIGN KEY ("createdByMembershipId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CurriculumSection" ADD CONSTRAINT "CurriculumSection_packId_fkey" FOREIGN KEY ("packId") REFERENCES "CurriculumPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningStudio" ADD CONSTRAINT "LearningStudio_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningStudio" ADD CONSTRAINT "LearningStudio_teacherMembershipId_fkey" FOREIGN KEY ("teacherMembershipId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LearningStudio" ADD CONSTRAINT "LearningStudio_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LearningStudio" ADD CONSTRAINT "LearningStudio_guardianMembershipId_fkey" FOREIGN KEY ("guardianMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LearningStudio" ADD CONSTRAINT "LearningStudio_curriculumPackId_fkey" FOREIGN KEY ("curriculumPackId") REFERENCES "CurriculumPack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LearnerSubmission" ADD CONSTRAINT "LearnerSubmission_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "LearningStudio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherReview" ADD CONSTRAINT "TeacherReview_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "LearningStudio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherReview" ADD CONSTRAINT "TeacherReview_teacherMembershipId_fkey" FOREIGN KEY ("teacherMembershipId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FamilyHandoff" ADD CONSTRAINT "FamilyHandoff_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "LearningStudio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiRun" ADD CONSTRAINT "AiRun_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiRun" ADD CONSTRAINT "AiRun_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "LearningStudio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiRun" ADD CONSTRAINT "AiRun_actorMembershipId_fkey" FOREIGN KEY ("actorMembershipId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
