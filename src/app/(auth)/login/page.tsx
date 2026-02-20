"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, AlertCircle, Lock, Mail, Eye, EyeOff, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { loginAction } from "@/lib/auth/actions";
import { useIsClient } from "@/lib/hooks/use-is-client";
import { getClientLocale } from "@/lib/i18n/client";
import { t } from "@/lib/i18n/messages";
import { AppLogo } from "@/components/shared/app-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const initialState = { error: undefined };

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, initialState);
  const mounted = useIsClient();
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const locale = mounted ? getClientLocale() : "es-MX";
  const highlights = [
    t(locale, "login_panel_feature_1"),
    t(locale, "login_panel_feature_2"),
    t(locale, "login_panel_feature_3"),
  ];

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.error]);

  return (
    <div className="relative animate-in fade-in duration-500">
      <div className="absolute right-0 top-0 z-20">
        <div className="rounded-full border border-border/70 bg-card/70 p-0.5 shadow-sm backdrop-blur">
          <ThemeToggle />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-[1.05fr_0.95fr] md:gap-6">
        <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/55 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur animate-in fade-in slide-in-from-left-2 duration-500 md:p-7 dark:shadow-[0_22px_50px_rgba(0,0,0,0.35)]">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-8 h-36 w-36 rounded-full bg-primary/12 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border/70 bg-card/85 shadow-sm">
                <AppLogo className="h-10 w-10" priority />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {t(locale, "login_brand_subtitle")}
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">SACDIA</h1>
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              {t(locale, "login_panel_description")}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Badge variant="default" className="rounded-full px-3 py-1 text-[11px]">
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t(locale, "login_security_badge")}
                </span>
              </Badge>
            </div>

            <Separator className="my-5 bg-border/70" />

            <ul className="space-y-3">
              {highlights.map((item, index) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/45 px-3.5 py-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${120 + index * 80}ms`, animationFillMode: "backwards" }}
                >
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/12 text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-[11px] text-muted-foreground/80">
              {t(locale, "login_footer")}
            </p>
          </div>
        </section>

        <Card className="relative overflow-hidden border-border/80 bg-card shadow-[0_20px_70px_rgba(15,23,42,0.16),0_0_0_1px_rgba(255,255,255,0.04)] animate-in fade-in slide-in-from-bottom-2 duration-500 dark:shadow-[0_24px_70px_rgba(0,0,0,0.52)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />

          <CardHeader className="space-y-3 p-7 pb-3">
            <Badge variant="default" className="w-fit rounded-full px-3 py-1 text-[11px]">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t(locale, "login_security_badge")}
              </span>
            </Badge>
            <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
              {t(locale, "login_welcome_title")}
            </CardTitle>
            <CardDescription className="text-[13px]">
              {t(locale, "login_welcome_description")}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-7 pt-1">
            <form action={action} method="POST" autoComplete="on" className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t(locale, "login_email_label")}
                </Label>
                <div className="group relative">
                  <Mail
                    className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200 ${
                      focusedField === "email" ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@sacdia.org"
                    required
                    autoComplete="username"
                    inputMode="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    className="h-12 rounded-xl border-input bg-background/85 pl-11 text-foreground placeholder:text-muted-foreground transition-colors focus-visible:border-primary/45 focus-visible:bg-background focus-visible:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t(locale, "login_password_label")}
                </Label>
                <div className="group relative">
                  <Lock
                    className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200 ${
                      focusedField === "password" ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    className="h-12 rounded-xl border-input bg-background/85 pl-11 pr-11 text-foreground placeholder:text-muted-foreground transition-colors focus-visible:border-primary/45 focus-visible:bg-background focus-visible:ring-primary/20"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? t(locale, "login_hide_password") : t(locale, "login_show_password")}
                    className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t(locale, "login_password_hint")}</p>
              </div>

              {state.error ? (
                <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-[13px] text-destructive animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {state.error}
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={pending}
                size="lg"
                className="group relative h-12 w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary/85 text-sm font-semibold shadow-[0_6px_24px_rgba(43,43,238,0.3)] transition-all duration-200 hover:brightness-110 hover:shadow-[0_8px_34px_rgba(43,43,238,0.42)] active:scale-[0.99]"
              >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative">
                  {pending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t(locale, "login_submit_loading")}
                    </span>
                  ) : (
                    t(locale, "login_submit_idle")
                  )}
                </span>
              </Button>

              <p className="rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
                {t(locale, "login_access_notice")}
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
