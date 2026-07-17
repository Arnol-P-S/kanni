-- Preserve completed or interrupted cycles before a school administrator
-- starts the same learning goal again.
ALTER TYPE "CycleStatus" ADD VALUE 'archived';
