-- ============================================================================
-- Bilingual Organization Task Management System - Seed Data
-- ============================================================================

-- Note: In production or local Supabase, users are created in auth.users first.
-- This script seeds groups, members, tasks, completions, notifications, and activity logs.

-- 1. Create mock users in auth.users if running in local supabase environment
DO $$
DECLARE
  v_admin_id UUID := 'a0000000-0000-0000-0000-000000000001';
  v_student1_id UUID := 'b0000000-0000-0000-0000-000000000001';
  v_student2_id UUID := 'b0000000-0000-0000-0000-000000000002';
  v_student3_id UUID := 'b0000000-0000-0000-0000-000000000003';
  v_student4_id UUID := 'b0000000-0000-0000-0000-000000000004';
  v_student5_id UUID := 'b0000000-0000-0000-0000-000000000005';

  v_grp_logistics UUID := 'c0000000-0000-0000-0000-000000000001';
  v_grp_comm UUID := 'c0000000-0000-0000-0000-000000000002';
  v_grp_marketing UUID := 'c0000000-0000-0000-0000-000000000003';
  v_grp_events UUID := 'c0000000-0000-0000-0000-000000000004';
  v_grp_tech UUID := 'c0000000-0000-0000-0000-000000000005';
  v_grp_admin UUID := 'c0000000-0000-0000-0000-000000000006';

  v_task1 UUID := 'd0000000-0000-0000-0000-000000000001';
  v_task2 UUID := 'd0000000-0000-0000-0000-000000000002';
  v_task3 UUID := 'd0000000-0000-0000-0000-000000000003';
  v_task4 UUID := 'd0000000-0000-0000-0000-000000000004';
BEGIN
  -- Insert into auth.users if not exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud)
    VALUES
      (v_admin_id, '00000000-0000-0000-0000-000000000000', 'admin@taskflow.org', crypt('AdminPassword123!', gen_salt('bf')), now(), '{"full_name": "Dr. Karim Bensalem", "role": "admin", "preferred_language": "fr"}'::jsonb, 'authenticated', 'authenticated'),
      (v_student1_id, '00000000-0000-0000-0000-000000000000', 'ahmed@taskflow.org', crypt('StudentPassword123!', gen_salt('bf')), now(), '{"full_name": "Ahmed Mansouri", "role": "student", "preferred_language": "ar"}'::jsonb, 'authenticated', 'authenticated'),
      (v_student2_id, '00000000-0000-0000-0000-000000000000', 'fatima@taskflow.org', crypt('StudentPassword123!', gen_salt('bf')), now(), '{"full_name": "Fatima Zahra El Idrissi", "role": "student", "preferred_language": "fr"}'::jsonb, 'authenticated', 'authenticated'),
      (v_student3_id, '00000000-0000-0000-0000-000000000000', 'youssef@taskflow.org', crypt('StudentPassword123!', gen_salt('bf')), now(), '{"full_name": "Youssef Alami", "role": "student", "preferred_language": "fr"}'::jsonb, 'authenticated', 'authenticated'),
      (v_student4_id, '00000000-0000-0000-0000-000000000000', 'sarah@taskflow.org', crypt('StudentPassword123!', gen_salt('bf')), now(), '{"full_name": "Sarah Benali", "role": "student", "preferred_language": "ar"}'::jsonb, 'authenticated', 'authenticated'),
      (v_student5_id, '00000000-0000-0000-0000-000000000000', 'omar@taskflow.org', crypt('StudentPassword123!', gen_salt('bf')), now(), '{"full_name": "Omar Tazi", "role": "student", "preferred_language": "fr"}'::jsonb, 'authenticated', 'authenticated')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Insert/Upsert into profiles
  INSERT INTO public.profiles (id, full_name, email, role, preferred_language, is_active)
  VALUES
    (v_admin_id, 'Dr. Karim Bensalem', 'admin@taskflow.org', 'admin', 'fr', true),
    (v_student1_id, 'Ahmed Mansouri', 'ahmed@taskflow.org', 'student', 'ar', true),
    (v_student2_id, 'Fatima Zahra El Idrissi', 'fatima@taskflow.org', 'student', 'fr', true),
    (v_student3_id, 'Youssef Alami', 'youssef@taskflow.org', 'student', 'fr', true),
    (v_student4_id, 'Sarah Benali', 'sarah@taskflow.org', 'student', 'ar', true),
    (v_student5_id, 'Omar Tazi', 'omar@taskflow.org', 'student', 'fr', true)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    preferred_language = EXCLUDED.preferred_language;

  -- 2. Insert Groups
  INSERT INTO public.groups (id, name, description, leader_id, is_active)
  VALUES
    (v_grp_logistics, 'Logistique / الخدمات اللوجستية', 'Gestion du matériel, transports et approvisionnement pour tous les événements.', v_student1_id, true),
    (v_grp_comm, 'Communication / التواصل', 'Gestion des réseaux sociaux, relations publiques et communiqués de presse.', v_student2_id, true),
    (v_grp_marketing, 'Marketing / التسويق', 'Campagnes de promotion, création de contenu publicitaire et acquisition.', v_student3_id, true),
    (v_grp_events, 'Événementiel / تنظيم الفعاليات', 'Planification opérationnelle, coordination le jour J et gestion des invités.', v_student4_id, true),
    (v_grp_tech, 'Équipe technique / الفريق التقني', 'Support audiovisuel, plateforme web, infrastructure et diffusion streaming.', v_student5_id, true),
    (v_grp_admin, 'Administration / الإدارة', 'Coordination générale, budgets et conformité institutionnelle.', v_admin_id, true)
  ON CONFLICT (id) DO NOTHING;

  -- 3. Group Memberships
  INSERT INTO public.group_members (group_id, student_id)
  VALUES
    -- Logistics group members
    (v_grp_logistics, v_student1_id),
    (v_grp_logistics, v_student3_id),
    (v_grp_logistics, v_student5_id),
    -- Communication group members
    (v_grp_comm, v_student2_id),
    (v_grp_comm, v_student4_id),
    -- Tech team members
    (v_grp_tech, v_student5_id),
    (v_grp_tech, v_student1_id),
    -- Events members
    (v_grp_events, v_student4_id),
    (v_grp_events, v_student2_id)
  ON CONFLICT DO NOTHING;

  -- 4. Tasks
  INSERT INTO public.tasks (id, title, description, created_by, priority, due_date)
  VALUES
    (
      v_task1,
      'Préparer le matériel de l''événement / تحضير معدات الفعالية',
      'Vérifier les microphones, projecteurs, câbles HDMI et préparer les badges d''accès des participants.',
      v_admin_id,
      'urgent',
      now() + INTERVAL '2 days'
    ),
    (
      v_task2,
      'Rédiger le communiqué de presse annuel / صياغة البيان الصحفي السنوي',
      'Préparer le communiqué bilingue (français/arabe) pour diffusion aux partenaires médias et sur LinkedIn.',
      v_admin_id,
      'high',
      now() + INTERVAL '5 days'
    ),
    (
      v_task3,
      'Déployer la mise à jour de la plateforme / نشر تحديث المنصة',
      'Vérifier la compatibilité RTL, tester les formulaires et déployer sur Vercel.',
      v_admin_id,
      'medium',
      now() + INTERVAL '7 days'
    ),
    (
      v_task4,
      'Inventaire des stocks et fournitures / جرد المخزون والمستلزمات',
      'Compter les stocks restants après le salon d''orientation et dresser la liste des réassorts nécessaires.',
      v_admin_id,
      'low',
      now() - INTERVAL '1 day' -- Overdue demo task
    )
  ON CONFLICT (id) DO NOTHING;

  -- 5. Task Assignments
  -- Task 1 assigned to Logistics group
  INSERT INTO public.task_group_assignments (task_id, group_id)
  VALUES (v_task1, v_grp_logistics)
  ON CONFLICT DO NOTHING;

  -- Task 2 assigned to Communication group
  INSERT INTO public.task_group_assignments (task_id, group_id)
  VALUES (v_task2, v_grp_comm)
  ON CONFLICT DO NOTHING;

  -- Task 3 assigned individually to Youssef and Omar
  INSERT INTO public.task_individual_assignments (task_id, student_id)
  VALUES 
    (v_task3, v_student3_id),
    (v_task3, v_student5_id)
  ON CONFLICT DO NOTHING;

  -- Task 4 assigned to Logistics and Sarah individually
  INSERT INTO public.task_group_assignments (task_id, group_id)
  VALUES (v_task4, v_grp_logistics)
  ON CONFLICT DO NOTHING;
  INSERT INTO public.task_individual_assignments (task_id, student_id)
  VALUES (v_task4, v_student4_id)
  ON CONFLICT DO NOTHING;

  -- 6. Task Completion tracking for students
  -- Task 1: Ahmed completed, Youssef in progress, Omar pending (demonstrating individual 1/3 completion!)
  INSERT INTO public.task_completions (task_id, student_id, status, completion_note, completed_at)
  VALUES
    (v_task1, v_student1_id, 'completed', 'Tout le matériel a été inspecté et rangé dans la salle de stockage A-12.', now() - INTERVAL '2 hours'),
    (v_task1, v_student3_id, 'in_progress', 'Vérification des micros en cours.', NULL),
    (v_task1, v_student5_id, 'pending', NULL, NULL)
  ON CONFLICT (task_id, student_id) DO UPDATE SET
    status = EXCLUDED.status,
    completion_note = EXCLUDED.completion_note,
    completed_at = EXCLUDED.completed_at;

  -- Task 2: Fatima in_progress, Sarah pending
  INSERT INTO public.task_completions (task_id, student_id, status, completion_note, completed_at)
  VALUES
    (v_task2, v_student2_id, 'in_progress', 'Premier jet rédigé, en relecture.', NULL),
    (v_task2, v_student4_id, 'pending', NULL, NULL)
  ON CONFLICT (task_id, student_id) DO NOTHING;

  -- Task 3: Omar completed, Youssef pending
  INSERT INTO public.task_completions (task_id, student_id, status, completion_note, completed_at)
  VALUES
    (v_task3, v_student5_id, 'completed', 'Déploiement réussi sur l''environnement de staging.', now() - INTERVAL '1 day'),
    (v_task3, v_student3_id, 'pending', NULL, NULL)
  ON CONFLICT (task_id, student_id) DO NOTHING;

  -- Task 4: overdue task
  INSERT INTO public.task_completions (task_id, student_id, status, completion_note, completed_at)
  VALUES
    (v_task4, v_student1_id, 'pending', NULL, NULL),
    (v_task4, v_student3_id, 'pending', NULL, NULL),
    (v_task4, v_student4_id, 'pending', NULL, NULL),
    (v_task4, v_student5_id, 'pending', NULL, NULL)
  ON CONFLICT (task_id, student_id) DO NOTHING;

  -- 7. Notifications
  INSERT INTO public.notifications (recipient_id, actor_id, task_id, notification_type, message_key, message_data, is_read, created_at)
  VALUES
    (
      v_admin_id,
      v_student1_id,
      v_task1,
      'task_completed',
      'notifications.taskCompleted',
      '{"student_name": "Ahmed Mansouri", "task_title": "Préparer le matériel de l''événement", "note": "Tout le matériel a été inspecté et rangé."}'::jsonb,
      false,
      now() - INTERVAL '2 hours'
    ),
    (
      v_admin_id,
      v_student5_id,
      v_task3,
      'task_completed',
      'notifications.taskCompleted',
      '{"student_name": "Omar Tazi", "task_title": "Déployer la mise à jour de la plateforme", "note": "Déploiement réussi."}'::jsonb,
      true,
      now() - INTERVAL '1 day'
    ),
    (
      v_student1_id,
      v_admin_id,
      v_task1,
      'task_assigned',
      'notifications.taskAssigned',
      '{"task_title": "Préparer le matériel de l''événement"}'::jsonb,
      true,
      now() - INTERVAL '2 days'
    );

  -- 8. Activity Logs
  INSERT INTO public.activity_logs (actor_id, action, entity_type, entity_id, metadata, created_at)
  VALUES
    (
      v_admin_id,
      'task_created',
      'task',
      v_task1,
      '{"task_title": "Préparer le matériel de l''événement", "group_name": "Logistique"}'::jsonb,
      now() - INTERVAL '2 days'
    ),
    (
      v_student1_id,
      'task_completed',
      'task',
      v_task1,
      '{"task_title": "Préparer le matériel de l''événement", "student_name": "Ahmed Mansouri"}'::jsonb,
      now() - INTERVAL '2 hours'
    ),
    (
      v_student5_id,
      'task_completed',
      'task',
      v_task3,
      '{"task_title": "Déployer la mise à jour de la plateforme", "student_name": "Omar Tazi"}'::jsonb,
      now() - INTERVAL '1 day'
    );
END $$;
