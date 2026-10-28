"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { Profile } from "@/types";
import {
  LayoutDashboard,
  CheckSquare,
  Users2,
  GraduationCap,
  Bell,
  History,
  BarChart3,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  profile: Profile;
  onNavigate?: () => void;
  className?: string;
}

export function Sidebar({ profile, onNavigate, className }: SidebarProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const isAdmin = profile.role === "admin";

  const adminNavItems = [
    { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/tasks", label: t("tasks"), icon: CheckSquare },
    { href: "/groups", label: t("groups"), icon: Users2 },
    { href: "/students", label: t("students"), icon: GraduationCap },
    { href: "/notifications", label: t("notifications"), icon: Bell },
    { href: "/activity", label: t("activityLog"), icon: History },
    { href: "/reports", label: t("reports"), icon: BarChart3 },
    { href: "/settings", label: t("settings"), icon: Settings },
  ];

  const studentNavItems = [
    { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/tasks", label: t("tasks"), icon: CheckSquare },
    { href: "/notifications", label: t("notifications"), icon: Bell },
    { href: "/settings", label: t("settings"), icon: Settings },
  ];

  const navItems = isAdmin ? adminNavItems : studentNavItems;

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-card border-e border-border w-64 select-none",
        className
      )}
    >
      {/* Brand logo header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-border shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base tracking-tight text-foreground">
            TaskFlow
          </span>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            {isAdmin ? "Admin Portal" : "Student Portal"}
          </span>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
