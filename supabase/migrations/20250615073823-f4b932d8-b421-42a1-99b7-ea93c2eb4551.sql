
-- 1. Change scheduled_at type from date to timestamp with time zone, preserving existing data
ALTER TABLE public.standups
  ALTER COLUMN scheduled_at TYPE timestamp with time zone
  USING scheduled_at::timestamp with time zone;

-- 2. (optional safety) For all future migrations/scripts: ensure scheduled_at is always timestamp with time zone
