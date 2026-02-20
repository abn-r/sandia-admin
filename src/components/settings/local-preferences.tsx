"use client";

import { useEffect, useState } from "react";
import { Languages, SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ADMIN_LOCALE_COOKIE,
  normalizeAdminLocale,
  toHtmlLang,
  type AdminLocale,
} from "@/lib/i18n/locale";

const STORAGE_KEY = "sacdia_admin_preferences";

type DateFormatValue = "dd/MM/yyyy" | "MM/dd/yyyy" | "yyyy-MM-dd";

type Preferences = {
  locale: AdminLocale;
  dateFormat: DateFormatValue;
  compactMode: boolean;
  showHints: boolean;
};

const defaultPreferences: Preferences = {
  locale: "es-MX",
  dateFormat: "dd/MM/yyyy",
  compactMode: false,
  showHints: true,
};

function loadPreferences(): Preferences {
  if (typeof window === "undefined") {
    return defaultPreferences;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultPreferences;
    }

    const parsed = JSON.parse(raw) as Partial<Preferences>;

    return {
      locale: normalizeAdminLocale(parsed.locale),
      dateFormat:
        parsed.dateFormat === "MM/dd/yyyy" || parsed.dateFormat === "yyyy-MM-dd"
          ? parsed.dateFormat
          : "dd/MM/yyyy",
      compactMode: Boolean(parsed.compactMode),
      showHints: parsed.showHints !== false,
    };
  } catch {
    return defaultPreferences;
  }
}

export function LocalPreferences() {
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    document.cookie = `${ADMIN_LOCALE_COOKIE}=${encodeURIComponent(preferences.locale)}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = toHtmlLang(preferences.locale);
  }, [preferences]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <SlidersHorizontal className="h-4 w-4" />
          Preferencias locales
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="locale" className="flex items-center gap-1.5">
            <Languages className="h-3.5 w-3.5" />
            Idioma de interfaz
          </Label>
          <Select
            id="locale"
            value={preferences.locale}
            onChange={(event) =>
              setPreferences((current) => ({
                ...current,
                locale: normalizeAdminLocale(event.target.value),
              }))
            }
          >
            <option value="es-MX">Espanol (MX)</option>
            <option value="es-ES">Espanol (ES)</option>
            <option value="en-US">English (US)</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="date_format">Formato de fecha</Label>
          <Select
            id="date_format"
            value={preferences.dateFormat}
            onChange={(event) =>
              setPreferences((current) => ({
                ...current,
                dateFormat: event.target.value as DateFormatValue,
              }))
            }
          >
            <option value="dd/MM/yyyy">DD/MM/YYYY</option>
            <option value="MM/dd/yyyy">MM/DD/YYYY</option>
            <option value="yyyy-MM-dd">YYYY-MM-DD</option>
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
          <div>
            <p className="text-sm font-medium">Modo compacto</p>
            <p className="text-xs text-muted-foreground">Reduce espacios para tablas extensas.</p>
          </div>
          <Switch
            checked={preferences.compactMode}
            onCheckedChange={(checked) =>
              setPreferences((current) => ({
                ...current,
                compactMode: checked,
              }))
            }
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
          <div>
            <p className="text-sm font-medium">Mostrar ayudas contextuales</p>
            <p className="text-xs text-muted-foreground">Mensajes guia para usuarios nuevos.</p>
          </div>
          <Switch
            checked={preferences.showHints}
            onCheckedChange={(checked) =>
              setPreferences((current) => ({
                ...current,
                showHints: checked,
              }))
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
