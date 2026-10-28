"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("deactivated") === "true") {
        setErrorMessage(t("accountDeactivatedSession"));
        toast.error(t("accountDeactivatedSession"));
      }
    }
  }, [t]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(t("errorInvalidCredentials"));
        toast.error(t("errorInvalidCredentials"));
        setIsLoading(false);
        return;
      }

      // Check whether user account is active in profiles
      if (data?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_active")
          .eq("id", data.user.id)
          .single();

        if (profile && !profile.is_active) {
          await supabase.auth.signOut();
          setErrorMessage(t("errorAccountDeactivated"));
          toast.error(t("errorAccountDeactivated"));
          setIsLoading(false);
          return;
        }
      }

      toast.success(tCommon("success"));
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage(t("errorGeneral"));
      toast.error(t("errorGeneral"));
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-50 via-sky-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 relative">
      {/* Top bar: theme toggle + language switcher */}
      <div className="absolute top-4 end-4 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {tCommon("appName")}
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs">
            {t("subtitle")}
          </p>
        </div>

        {/* Login form card */}
        <Card className="shadow-xl border-border/80">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-center">
              {t("title")}
            </CardTitle>
            <CardDescription className="text-center text-xs">
              {t("subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  {t("email")}
                </label>
                <Input
                  type="email"
                  dir="ltr"
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="ltr-only"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  {t("password")}
                </label>
                <Input
                  type="password"
                  dir="ltr"
                  placeholder={t("passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="ltr-only"
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-2 font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span>{t("loggingIn")}</span>
                ) : (
                  <>
                    <span>{t("login")}</span>
                    <ArrowRight className={`h-4 w-4 ${locale === "ar" ? "rotate-180" : ""}`} />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          {/* Quick Demo Credentials */}
          <CardFooter className="flex flex-col gap-2 pt-0 pb-6 border-t border-border/60 bg-muted/20 rounded-b-xl">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-3">
              {t("demoCredentialsTitle")}
            </span>
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillDemoAccount("admin@taskflow.org", "AdminPassword123!")}
                className="text-xs flex items-center gap-1.5 h-9"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span className="truncate">{t("roleAdmin")}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillDemoAccount("ahmed@taskflow.org", "StudentPassword123!")}
                className="text-xs flex items-center gap-1.5 h-9"
              >
                <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span className="truncate">{t("roleStudent")}</span>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
