
-- Create learning_hours table similar to standups
CREATE TABLE public.learning_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- Create learning_hours_attendance table similar to attendance
CREATE TABLE public.learning_hours_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  learning_hour_id UUID REFERENCES public.learning_hours(id) ON DELETE CASCADE,
  employee_id TEXT REFERENCES public.employees(employee_id) ON DELETE CASCADE,
  status TEXT DEFAULT 'Absent' CHECK (status IN ('Present', 'Absent', 'Missed', 'Not Available')),
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  marked_by UUID
);
