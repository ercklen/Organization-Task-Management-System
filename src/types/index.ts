export type Role = "admin" | "student";
export type Language = "fr" | "ar";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "pending" | "in_progress" | "completed";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  avatar_url?: string | null;
  preferred_language: Language;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string | null;
  leader_id?: string | null;
  leader?: Profile | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  member_count?: number;
  members?: GroupMember[];
}

export interface GroupMember {
  id: string;
  group_id: string;
  student_id: string;
  joined_at: string;
  left_at?: string | null;
  created_at: string;
  student?: Profile;
  group?: Group;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  created_by: string;
  priority: TaskPriority;
  due_date: string;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
  creator?: Profile;
}

export interface TaskGroupAssignment {
  id: string;
  task_id: string;
  group_id: string;
  assigned_at: string;
  group?: Group;
}

export interface TaskIndividualAssignment {
  id: string;
  task_id: string;
  student_id: string;
  assigned_at: string;
  student?: Profile;
}

export interface TaskCompletion {
  id: string;
  task_id: string;
  student_id: string;
  status: TaskStatus;
  completion_note?: string | null;
  evidence_url?: string | null;
  completed_at?: string | null;
  updated_at: string;
  student?: Profile;
  task?: Task;
}

export interface TaskWithDetails extends Task {
  assigned_groups?: Group[];
  assigned_students?: Profile[];
  completions?: TaskCompletion[];
  total_assigned?: number;
  completed_count?: number;
  in_progress_count?: number;
  pending_count?: number;
  completion_rate?: number;
  my_completion?: TaskCompletion;
}

export interface NotificationItem {
  id: string;
  recipient_id: string;
  actor_id?: string | null;
  task_id?: string | null;
  notification_type: string;
  message_key: string;
  message_data: Record<string, any>;
  is_read: boolean;
  created_at: string;
  actor?: Profile | null;
  task?: Task | null;
}

export interface ActivityLog {
  id: string;
  actor_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  metadata: Record<string, any>;
  created_at: string;
  actor?: Profile | null;
}

export interface OrganizationSettings {
  id: string;
  org_name: string;
  timezone: string;
  default_language: Language;
  allow_student_evidence: boolean;
  updated_at: string;
}
