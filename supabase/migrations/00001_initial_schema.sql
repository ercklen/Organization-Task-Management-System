-- ============================================================================
-- Bilingual Organization Task Management System - Schema Migration
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'student')) DEFAULT 'student',
  avatar_url TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'fr' CHECK (preferred_language IN ('fr', 'ar')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Helper function to check if current user is admin (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin' AND is_active = true
  );
$$;

-- 2. GROUPS TABLE
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_groups_is_active ON public.groups(is_active);
CREATE INDEX IF NOT EXISTS idx_groups_leader_id ON public.groups(leader_id);

-- 3. GROUP MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  left_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Unique constraint: a student cannot be an active member of the same group twice
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_group_membership 
ON public.group_members (group_id, student_id) 
WHERE (left_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_group_members_student ON public.group_members(student_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);

-- 4. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  due_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_archived_at ON public.tasks(archived_at);

-- 5. TASK GROUP ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.task_group_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_task_group UNIQUE (task_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_task_group_task ON public.task_group_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_group_group ON public.task_group_assignments(group_id);

-- 6. TASK INDIVIDUAL ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.task_individual_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_task_student UNIQUE (task_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_task_individual_task ON public.task_individual_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_individual_student ON public.task_individual_assignments(student_id);

-- 7. TASK COMPLETIONS (Individual tracking for every student assigned)
CREATE TABLE IF NOT EXISTS public.task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  completion_note TEXT,
  evidence_url TEXT,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_task_student_completion UNIQUE (task_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_task_completions_task ON public.task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_student ON public.task_completions(student_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_status ON public.task_completions(status);

-- 8. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  message_key TEXT NOT NULL,
  message_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 9. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);

-- 10. ORGANIZATION SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name TEXT NOT NULL DEFAULT 'TaskFlow Organization',
  timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
  default_language TEXT NOT NULL DEFAULT 'fr' CHECK (default_language IN ('fr', 'ar')),
  allow_student_evidence BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_task_completions_updated_at
  BEFORE UPDATE ON public.task_completions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger when task completion changes (completed or reopened)
CREATE OR REPLACE FUNCTION public.handle_task_completion_status()
RETURNS TRIGGER AS $$
DECLARE
  v_student_name TEXT;
  v_task_title TEXT;
  v_admin_rec RECORD;
BEGIN
  -- Fetch student name and task title
  SELECT full_name INTO v_student_name FROM public.profiles WHERE id = NEW.student_id;
  SELECT title INTO v_task_title FROM public.tasks WHERE id = NEW.task_id;

  -- 1. When status changed to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    NEW.completed_at = timezone('utc'::text, now());

    -- Create notifications for all active administrators
    FOR v_admin_rec IN (SELECT id FROM public.profiles WHERE role = 'admin' AND is_active = true) LOOP
      INSERT INTO public.notifications (
        recipient_id,
        actor_id,
        task_id,
        notification_type,
        message_key,
        message_data
      ) VALUES (
        v_admin_rec.id,
        NEW.student_id,
        NEW.task_id,
        'task_completed',
        'notifications.taskCompleted',
        jsonb_build_object(
          'student_name', COALESCE(v_student_name, 'Étudiant'),
          'task_title', COALESCE(v_task_title, 'Tâche'),
          'note', NEW.completion_note
        )
      );
    END LOOP;

    -- Insert into activity log
    INSERT INTO public.activity_logs (
      actor_id,
      action,
      entity_type,
      entity_id,
      metadata
    ) VALUES (
      NEW.student_id,
      'task_completed',
      'task',
      NEW.task_id,
      jsonb_build_object(
        'student_id', NEW.student_id,
        'student_name', v_student_name,
        'task_title', v_task_title,
        'note', NEW.completion_note
      )
    );

  -- 2. When status reopened / transitioned from completed to in_progress or pending
  ELSIF (OLD.status = 'completed') AND (NEW.status IN ('pending', 'in_progress')) THEN
    NEW.completed_at = NULL;

    -- Notify the student that task was reopened
    INSERT INTO public.notifications (
      recipient_id,
      actor_id,
      task_id,
      notification_type,
      message_key,
      message_data
    ) VALUES (
      NEW.student_id,
      auth.uid(),
      NEW.task_id,
      'task_reopened',
      'notifications.taskReopened',
      jsonb_build_object(
        'task_title', COALESCE(v_task_title, 'Tâche')
      )
    );

    -- Insert into activity log
    INSERT INTO public.activity_logs (
      actor_id,
      action,
      entity_type,
      entity_id,
      metadata
    ) VALUES (
      auth.uid(),
      'task_reopened',
      'task',
      NEW.task_id,
      jsonb_build_object(
        'student_id', NEW.student_id,
        'task_title', v_task_title
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER trigger_on_task_completion_status
  BEFORE UPDATE ON public.task_completions
  FOR EACH ROW EXECUTE FUNCTION public.handle_task_completion_status();

-- Trigger to sync user creation from auth.users to public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, preferred_language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'fr')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_group_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_individual_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
-- Admins have full access
CREATE POLICY "Admins have full access to profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Students can read all active profiles (to see leader, group members, admin)
CREATE POLICY "Users can read profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Students can update ONLY their own profile (avatar_url, preferred_language, full_name)
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() 
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    AND is_active = (SELECT is_active FROM public.profiles WHERE id = auth.uid())
  );

-- 2. GROUPS POLICIES
CREATE POLICY "Admins have full access to groups"
  ON public.groups FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Users can read active groups"
  ON public.groups FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 3. GROUP MEMBERS POLICIES
CREATE POLICY "Admins have full access to group_members"
  ON public.group_members FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Users can view group members"
  ON public.group_members FOR SELECT
  TO authenticated
  USING (true);

-- 4. TASKS POLICIES
CREATE POLICY "Admins have full access to tasks"
  ON public.tasks FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Students can view tasks assigned to them or their groups"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (
    archived_at IS NULL AND (
      -- Direct individual assignment
      EXISTS (
        SELECT 1 FROM public.task_individual_assignments tia
        WHERE tia.task_id = tasks.id AND tia.student_id = auth.uid()
      )
      OR
      -- Group assignment
      EXISTS (
        SELECT 1 FROM public.task_group_assignments tga
        JOIN public.group_members gm ON gm.group_id = tga.group_id
        WHERE tga.task_id = tasks.id 
          AND gm.student_id = auth.uid() 
          AND gm.left_at IS NULL
      )
    )
  );

-- 5. TASK GROUP ASSIGNMENTS POLICIES
CREATE POLICY "Admins have full access to task_group_assignments"
  ON public.task_group_assignments FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Students can view group assignments for their groups"
  ON public.task_group_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = task_group_assignments.group_id
        AND gm.student_id = auth.uid()
        AND gm.left_at IS NULL
    )
  );

-- 6. TASK INDIVIDUAL ASSIGNMENTS POLICIES
CREATE POLICY "Admins have full access to task_individual_assignments"
  ON public.task_individual_assignments FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Students can view their own individual task assignments"
  ON public.task_individual_assignments FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- 7. TASK COMPLETIONS POLICIES
CREATE POLICY "Admins have full access to task_completions"
  ON public.task_completions FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Students can view their own task completions"
  ON public.task_completions FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own task completions"
  ON public.task_completions FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own task completions"
  ON public.task_completions FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- 8. NOTIFICATIONS POLICIES
CREATE POLICY "Admins can view and manage their own notifications"
  ON public.notifications FOR ALL
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "Students can view and update their own notifications"
  ON public.notifications FOR ALL
  TO authenticated
  USING (recipient_id = auth.uid());

-- 9. ACTIVITY LOGS POLICIES
CREATE POLICY "Admins can view activity logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert activity logs"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Students can view activity logs where they are the actor"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (actor_id = auth.uid());

-- 10. ORGANIZATION SETTINGS POLICIES
CREATE POLICY "Admins have full access to organization_settings"
  ON public.organization_settings FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Authenticated users can read organization settings"
  ON public.organization_settings FOR SELECT
  TO authenticated
  USING (true);

-- Insert initial organization settings
INSERT INTO public.organization_settings (org_name, timezone, default_language)
VALUES ('TaskFlow Organization', 'Europe/Paris', 'fr')
ON CONFLICT DO NOTHING;

-- Enable Realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_completions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
