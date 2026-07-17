ALTER TABLE "LearningCycle"
ADD COLUMN "planAgencyMove" VARCHAR(300) NOT NULL DEFAULT 'Ask for a prediction, show only the selected scaffold, then ask the learner to explain.',
ADD COLUMN "supportThinkingPrompts" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "supportHandoffPrompt" VARCHAR(260) NOT NULL DEFAULT 'Use what you noticed to choose again and explain your reason.';
