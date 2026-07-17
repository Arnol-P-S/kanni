CREATE TYPE "ScaffoldLevel" AS ENUM ('guided', 'light', 'independent');
CREATE TYPE "MakerPath" AS ENUM ('fair_share_plan', 'fraction_pattern', 'teach_with_objects');
CREATE TYPE "ArtifactCritique" AS ENUM ('evidence_missing', 'whole_size_unclear', 'explanation_unclear', 'ready_to_test');

ALTER TABLE "LearningCycle"
ADD COLUMN "scaffoldLevel" "ScaffoldLevel" NOT NULL DEFAULT 'guided',
ADD COLUMN "makerPath" "MakerPath",
ADD COLUMN "artifactDraft" VARCHAR(700),
ADD COLUMN "artifactCritique" "ArtifactCritique",
ADD COLUMN "artifactRevision" VARCHAR(700),
ADD COLUMN "nextScaffoldLevel" "ScaffoldLevel",
ADD COLUMN "artifactSubmittedAt" TIMESTAMP(3);
