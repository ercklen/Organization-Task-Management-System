"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Profile } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings } from "lucide-react";

interface UserNavProps {
  profile: Profile;
}

export function UserNav({ profile }: UserNavProps) {
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
    : "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 p-1 rounded-full hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarImage src={profile.avatar_url || ""} alt={profile.full_name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col text-start">
            <span className="text-sm font-semibold text-foreground leading-none">
              {profile.full_name}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {profile.role === "admin" ? tAuth("roleAdmin") : tAuth("roleStudent")}
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none">{profile.full_name}</p>
              <Badge variant={profile.role === "admin" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                {profile.role === "admin" ? tAuth("roleAdmin") : tAuth("roleStudent")}
              </Badge>
            </div>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {profile.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/settings")} className="cursor-pointer">
          <Settings className="me-2 h-4 w-4" />
          <span>{t("settings")}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
          <LogOut className="me-2 h-4 w-4" />
          <span>{t("logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
