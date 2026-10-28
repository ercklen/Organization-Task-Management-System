"use client";

import { useState } from "react";
import { Profile } from "@/types";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { UserNav } from "./UserNav";
import { Sidebar } from "./Sidebar";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  profile: Profile;
}

export function Header({ profile }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-card/80 px-4 md:px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <span className="font-semibold text-sm md:text-base text-foreground hidden sm:inline-block">
            {profile.role === "admin" ? "Administration" : "Espace Étudiant"}
          </span>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <ThemeToggle />
          <LanguageSwitcher />
          <NotificationBell userId={profile.id} />
          <div className="h-5 w-px bg-border mx-0.5 sm:mx-1" />
          <UserNav profile={profile} />
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-[80vw] bg-card h-full z-10 shadow-2xl animate-in slide-in-from-start">
            <div className="absolute top-4 end-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Sidebar
              profile={profile}
              onNavigate={() => setMobileMenuOpen(false)}
              className="w-full border-none"
            />
          </div>
        </div>
      )}
    </>
  );
}
