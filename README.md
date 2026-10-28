# TaskFlow — Bilingual Organization Task Management System

A production-ready, enterprise-grade Organization Task Management Application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase (PostgreSQL, Auth & Realtime)**, and **next-intl**.

Designed specifically for organizational structures where administrators manage student bodies, structure them into specialized divisions (e.g. *Logistique*, *Communication*, *Marketing*, *Événementiel*, *Équipe technique*, *Administration*), and assign individual or group tasks with individual completion tracking.

---

## 🌟 Key Features

### 1. Bilingual Architecture (French & Arabic)
- **Automatic Direction & Locale Switching**:
  - French (`/fr`): standard LTR layout (`dir="ltr"`, `lang="fr"`).
  - Arabic (`/ar`): authentic RTL layout (`dir="rtl"`, `lang="ar"`) with Cairo Arabic typography and logical CSS properties (`ps-*`, `pe-*`, `ms-*`, `me-*`, `start-*`, `end-*`).
- **Complete Localization**: Zero hardcoded strings. Every label, status, priority, validation message, chart tooltip, modal, and date is localized via `messages/fr.json` and `messages/ar.json`.
- **Dynamic Language Switcher**: Switch languages from anywhere in the app (login page, top header) with instant route replacement preserving user context.
- **Language Preference Persistence**: Stored in `profiles.preferred_language` and synced to sessions.

### 2. Dual Role System (Admin & Student)
- **Administrator**:
  - Full operational SaaS dashboard with live analytics and metric cards.
  - Interactive Recharts visualizing group completion percentages and task status distributions.
  - Complete Group Management: create, edit, archive groups, assign group leaders, add/remove members without erasing historical data.
  - Advanced Task Assignment: assign to single/multiple groups, single/multiple students, define priorities (Low, Medium, High, Urgent), deadlines, and descriptions.
  - **Individual Completion Tracking**: For any group task (e.g. 10 students in Logistics), each student has an independent `task_completions` record. Shows 0/10, 1/10, 6/10 progress in real time.
  - Reopen completed tasks for specific students with automatic status resets and notification dispatch.
  - Audit trail via persistent `activity_logs`.
  - Comprehensive CSV reporting with UTF-8 BOM encoding for Microsoft Excel & Google Sheets compatibility.
- **Student**:
  - Secure personal dashboard showcasing assigned tasks, pending tasks, and personal completion rates.
  - View individual tasks and group assignments.
  - Fast, secure **"Mark as Completed"** modal with optional completion note and evidence link.
  - Personal completion history with timestamps and notes.
  - Real-time notifications for new assignments, approaching deadlines, or reopened tasks.

### 3. Real-Time Persistent Notifications
- Database-backed `public.notifications` table storing structured JSONB payloads for language independence.
- PostgreSQL triggers automatically notify all administrators upon student task completion and notify students when tasks are assigned or reopened.
- Real-time notification bell in the header with unread badge counter, audio/visual toasts via `sonner`, and instant dropdown preview.
- Full `/notifications` archive page with unread filters and single/bulk read marking.

### 4. Enterprise Security & PostgreSQL RLS
- Row Level Security (RLS) enabled on all 10 application tables.
- Server-side authorization checks on all Next.js Server Actions.
- Security Definer helper `is_admin()` prevents RLS recursion and protects administrative tables.
- Students cannot elevate their own role, access other students' private drafts, or alter audit logs.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router with Server Components & Server Actions) |
| **Language** | TypeScript (Strict Mode) |
| **Styling** | Tailwind CSS with CSS Variables & RTL logical properties |
| **Components** | Radix UI primitives & custom accessible components |
| **Icons** | Lucide React |
| **Database & Auth** | Supabase (PostgreSQL, Supabase Auth SSR, Supabase Realtime) |
| **Internationalization** | next-intl (Routing prefix `/fr` and `/ar`) |
| **Charts** | Recharts (Responsive, localized) |
| **Toast Notifications** | Sonner |
| **Testing** | Vitest & Testing Library |

---

## 🗄️ Database Architecture

The schema is defined in `supabase/migrations/00001_initial_schema.sql` and seeded in `supabase/seed.sql`:

1. `profiles`: Extends `auth.users` with `full_name`, `email`, `role` (`admin` \| `student`), `avatar_url`, `preferred_language`, `is_active`.
2. `groups`: Organizational teams (`name`, `description`, `leader_id`, `is_active`).
3. `group_members`: Active memberships (`group_id`, `student_id`, `joined_at`, `left_at`).
4. `tasks`: Core task definitions (`title`, `description`, `created_by`, `priority`, `due_date`, `archived_at`).
5. `task_group_assignments`: Junction for tasks assigned to groups (`task_id`, `group_id`).
6. `task_individual_assignments`: Junction for tasks assigned directly to students (`task_id`, `student_id`).
7. `task_completions`: **Independent completion record per student** (`task_id`, `student_id`, `status`, `completion_note`, `evidence_url`, `completed_at`).
8. `notifications`: Persistent alerts (`recipient_id`, `actor_id`, `task_id`, `notification_type`, `message_key`, `message_data`, `is_read`).
9. `activity_logs`: Transparent audit history (`actor_id`, `action`, `entity_type`, `entity_id`, `metadata`).
10. `organization_settings`: Organization name, timezone, default language, and evidence submission toggles.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+ (tested on Node.js v24)
- npm 9+
- A Supabase project (Free tier or local Supabase CLI)

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd "Organization Task Management System"
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase project credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Database Migrations in Supabase
1. Open your Supabase Dashboard: `https://supabase.com/dashboard/project/<your-project-ref>`
2. Go to the **SQL Editor**.
3. Copy and run `supabase/migrations/00001_initial_schema.sql`.
4. Copy and run `supabase/seed.sql` to populate sample groups, tasks, students, and demo accounts.
5. In **Database > Publications**, ensure `supabase_realtime` has `tasks`, `task_completions`, `notifications`, `groups`, and `activity_logs` enabled.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The app will automatically redirect to `/fr/login` or `/ar/login`.

---

## 🧪 Testing & Verification

Run the test suite with Vitest:
```bash
npm test
```
The test suite validates:
- Complete parity between French (`fr.json`) and Arabic (`ar.json`) translation dictionaries.
- Group task assignment logic and individual 0/10, 1/10, 6/10 completion calculations.
- Protection against duplicate assignments when a student belongs to multiple assigned groups.
- Security and role-based access control policies.

Build the application for production:
```bash
npm run build
```

---

## 🔑 Demo Accounts (from `supabase/seed.sql`)

| Role | Email | Password | Default Lang |
|---|---|---|---|
| **Administrator** | `admin@taskflow.org` | `AdminPassword123!` | Français (`fr`) |
| **Student (Ahmed)** | `ahmed@taskflow.org` | `StudentPassword123!` | العربية (`ar`) |
| **Student (Fatima)** | `fatima@taskflow.org` | `StudentPassword123!` | Français (`fr`) |

*(Quick demo buttons are also provided directly on the login screen for convenient one-click evaluation).*

---

## 🌐 Vercel Deployment Instructions

1. **Push Code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: complete bilingual task management system"
   git remote add origin <your-github-repo>
   git push -u origin main
   ```
2. **Import Project to Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
   - Select your GitHub repository.
3. **Configure Environment Variables**:
   In the Vercel project deployment settings, add:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon/Public Key.
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Secret Key.
   - `NEXT_PUBLIC_APP_URL`: Your Vercel production domain (e.g. `https://taskflow.vercel.app`).
4. **Deploy**:
   - Click **Deploy**. Vercel will automatically run `npm run build` and provision the edge routes.
5. **Configure Supabase Auth Redirects**:
   - In your Supabase Dashboard under **Authentication > URL Configuration**:
   - Set **Site URL** to `https://<your-project>.vercel.app`.
   - Add `https://<your-project>.vercel.app/**` to **Redirect URLs**.
6. **Verify Realtime in Production**:
   - Log in as `admin@taskflow.org` in one browser window.
   - Log in as `ahmed@taskflow.org` in another window or incognito session.
   - Complete a task as Ahmed. Observe the real-time notification badge, toast alert, and dashboard progress counter update instantly in the admin window!
