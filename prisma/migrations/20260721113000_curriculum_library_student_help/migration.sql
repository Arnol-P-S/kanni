CREATE TYPE "CurriculumStatus" AS ENUM ('active', 'archived');

ALTER TABLE "CurriculumPack"
ADD COLUMN "status" "CurriculumStatus" NOT NULL DEFAULT 'active';

ALTER TABLE "LearningStudio"
ADD COLUMN "studentHelpStatus" "AiStatus" NOT NULL DEFAULT 'not_requested';

CREATE TABLE "StudentHelp" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "sourceSectionIds" JSONB NOT NULL,
    "model" VARCHAR(120) NOT NULL,
    "promptVersion" VARCHAR(60) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentHelp_pkey" PRIMARY KEY ("id")
);

DROP INDEX "CurriculumPack_schoolId_subject_gradeLabel_idx";

CREATE INDEX "CurriculumPack_schoolId_status_subject_gradeLabel_idx"
ON "CurriculumPack"("schoolId", "status", "subject", "gradeLabel");

CREATE UNIQUE INDEX "StudentHelp_studioId_key" ON "StudentHelp"("studioId");
CREATE INDEX "StudentHelp_studentMembershipId_createdAt_idx"
ON "StudentHelp"("studentMembershipId", "createdAt");

ALTER TABLE "StudentHelp"
ADD CONSTRAINT "StudentHelp_studioId_fkey"
FOREIGN KEY ("studioId") REFERENCES "LearningStudio"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentHelp"
ADD CONSTRAINT "StudentHelp_studentMembershipId_fkey"
FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
