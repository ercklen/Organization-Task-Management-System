"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { Profile, OrganizationSettings } from "@/types";
import { updateProfileSettingsAction, updateOrgSettingsAction } from "@/actions/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Settings, User, Building, Globe, Save } from "lucide-react";
import { toast } from "sonner";

interface SettingsViewProps {
  profile: Profile;
  orgSettings: OrganizationSettings | null;
}

export function SettingsView({ profile, orgSettings }: SettingsViewProps) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  // Profile Form state
  const [fullName, setFullName] = useState(profile.full_name);
  const [preferredLang, setPreferredLang] = useState<"fr" | "ar">(profile.preferred_language || "fr");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Org Settings Form state (if admin)
  const [orgName, setOrgName] = useState(orgSettings?.org_name || "TaskFlow Organization");
  const [timezone, setTimezone] = useState(orgSettings?.timezone || "Europe/Paris");
  const [defaultLang, setDefaultLang] = useState<"fr" | "ar">(orgSettings?.default_language || "fr");
  const [allowEvidence, setAllowEvidence] = useState(orgSettings?.allow_student_evidence ?? true);
  const [isSavingOrg, setIsSavingOrg] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      const res = await updateProfileSettingsAction({
        full_name: fullName,
        preferred_language: preferredLang,
      });

      if (!res.success) {
        toast.error(res.error || tCommon("error"));
        setIsSavingProfile(false);
        return;
      }

      toast.success(tCommon("success"));

      // Switch language if changed
      if (preferredLang !== locale) {
        router.replace(pathname, { locale: preferredLang });
      } else {
        router.refresh();
      }
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingOrg(true);

    try {
      const res = await updateOrgSettingsAction({
        org_name: orgName,
        timezone,
        default_language: defaultLang,
        allow_student_evidence: allowEvidence,
      });

      if (!res.success) {
        toast.error(res.error || tCommon("error"));
        setIsSavingOrg(false);
        return;
      }

      toast.success(t("saved"));
      router.refresh();
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsSavingOrg(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {/* User Personal Profile Card */}
      <Card>
        <form onSubmit={handleSaveProfile}>
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              <User className="h-5 w-5" />
              <CardTitle className="text-base font-semibold">
                Profil utilisateur
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Mettez à jour votre nom d&apos;affichage et votre langue d&apos;interface.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Nom complet
                </label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={isSavingProfile}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Adresse e-mail
                </label>
                <Input
                  value={profile.email}
                  disabled
                  className="text-sm bg-muted/50 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                Langue d&apos;affichage de l&apos;interface
              </label>
              <select
                value={preferredLang}
                onChange={(e) => setPreferredLang(e.target.value as any)}
                disabled={isSavingProfile}
                className="flex h-10 w-full sm:w-64 rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="fr">Français (LTR)</option>
                <option value="ar">العربية (RTL)</option>
              </select>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Button
              type="submit"
              size="sm"
              disabled={isSavingProfile}
              className="gap-1.5 text-xs ms-auto"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSavingProfile ? tCommon("loading") : tCommon("save")}</span>
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Organization Settings Card (Admin only) */}
      {profile.role === "admin" && (
        <Card>
          <form onSubmit={handleSaveOrg}>
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <Building className="h-5 w-5" />
                <CardTitle className="text-base font-semibold">
                  Paramètres de l&apos;Organisation
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Configuration générale applicable à tous les étudiants et groupes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {t("orgName")}
                  </label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                    disabled={isSavingOrg}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {t("timezone")}
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    disabled={isSavingOrg}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="Europe/Paris">Europe/Paris (UTC+1 / UTC+2)</option>
                    <option value="Africa/Casablanca">Africa/Casablanca (UTC+0 / UTC+1)</option>
                    <option value="UTC">UTC (Temps universel coordonné)</option>
                    <option value="Asia/Riyadh">Asia/Riyadh (UTC+3)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="allowEvidence"
                  checked={allowEvidence}
                  onChange={(e) => setAllowEvidence(e.target.checked)}
                  disabled={isSavingOrg}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="allowEvidence" className="text-xs font-medium text-foreground cursor-pointer">
                  {t("allowEvidence")}
                </label>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button
                type="submit"
                size="sm"
                disabled={isSavingOrg}
                className="gap-1.5 text-xs ms-auto"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{isSavingOrg ? tCommon("loading") : tCommon("save")}</span>
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
}
