UPDATE "LearningCycle"
SET "supportThinkingPrompts" = CASE "selectedSupport"::text
  WHEN 'guided_questions' THEN '["Are both wholes the same size?", "How many equal parts does each whole have?", "What happens to each part when the same whole is split into more equal parts?"]'::jsonb
  WHEN 'explain_to_someone' THEN '["Point to one half and describe what you notice.", "Point to one quarter and describe what changed.", "Explain why the size of the whole must stay the same for a fair comparison."]'::jsonb
  ELSE '["How many equal parts are in each strip?", "What stays the same between the two strips?", "What changes when the same whole is split into more equal parts?"]'::jsonb
END
WHERE "supportThinkingPrompts" = '[]'::jsonb;
