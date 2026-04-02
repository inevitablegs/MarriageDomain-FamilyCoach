-- Store a fixed question set per session so both partners answer the exact same assessment.

ALTER TABLE IF EXISTS couple_assessment_sessions
ADD COLUMN IF NOT EXISTS question_set jsonb NOT NULL DEFAULT '[]'::jsonb;
