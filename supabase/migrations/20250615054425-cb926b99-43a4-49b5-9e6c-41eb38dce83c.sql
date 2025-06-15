
-- 1. Table to store employees (team members)
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL
);

-- 2. Table for standup meetings (scheduled by admin)
CREATE TABLE public.standups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_at DATE NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table for per-employee attendance at every standup
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  standup_id UUID REFERENCES public.standups(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('Present', 'Missed', 'Not Available', 'Absent')) DEFAULT 'Absent',
  marked_by UUID,
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (employee_id, standup_id)
);

-- Enable row level security for all tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Policies: for now, allow all actions for authenticated users (can be tightened later)
CREATE POLICY "Allow read all" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Allow insert"   ON public.employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update"   ON public.employees FOR UPDATE USING (true);
CREATE POLICY "Allow delete"   ON public.employees FOR DELETE USING (true);

CREATE POLICY "Allow read all" ON public.standups FOR SELECT USING (true);
CREATE POLICY "Allow insert"   ON public.standups FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update"   ON public.standups FOR UPDATE USING (true);
CREATE POLICY "Allow delete"   ON public.standups FOR DELETE USING (true);

CREATE POLICY "Allow read all" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Allow insert"   ON public.attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update"   ON public.attendance FOR UPDATE USING (true);
CREATE POLICY "Allow delete"   ON public.attendance FOR DELETE USING (true);
