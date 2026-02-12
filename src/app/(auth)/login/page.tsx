"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Compass, Loader2, AlertCircle, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { loginAction } from "@/lib/auth/actions";

const initialState = { error: undefined };

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, initialState);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.error]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    };

    card.addEventListener("mousemove", handleMove);
    return () => card.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div
      className="transition-all duration-700 ease-out"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0) scale(1)" : "translateY(20px) scale(0.98)",
      }}
    >
      {/* Logo con glow animado */}
      <div className="mb-10 text-center">
        <div className="relative mx-auto mb-5 h-16 w-16">
          <div className="absolute inset-0 animate-pulse rounded-2xl bg-[rgba(43,43,238,0.3)] blur-xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2b2bee] to-[#1e1ebd] shadow-[0_8px_32px_rgba(43,43,238,0.4)]">
            <Compass className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">SACDIA</h1>
        <p className="mt-1.5 text-sm text-white/40">Panel Administrativo</p>
      </div>

      {/* Card con sombra y efecto de luz */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#16162c] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)]"
      >
        {/* Efecto de luz que sigue el mouse */}
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-300"
          style={{
            background: "radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(43,43,238,0.07), transparent 40%)",
            opacity: focusedField ? 1 : 0,
          }}
        />

        <div className="relative">
          <h2 className="text-lg font-semibold text-white">Bienvenido</h2>
          <p className="mt-1 text-[13px] text-slate-400">
            Inicia sesion con tu cuenta de administrador.
          </p>

          <form action={action} className="mt-7 space-y-5">
            {/* Campo Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wider text-slate-400">
                Correo electronico
              </label>
              <div className="group relative">
                <Mail className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200 ${focusedField === "email" ? "text-[#2b2bee]" : "text-slate-500"}`} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@sacdia.org"
                  required
                  autoComplete="email"
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className="h-12 w-full rounded-xl border border-slate-700 bg-slate-900/50 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 transition-all duration-200 focus:border-[#2b2bee]/40 focus:bg-slate-900 focus:outline-none focus:shadow-[0_0_0_3px_rgba(43,43,238,0.12)]"
                />
              </div>
            </div>

            {/* Campo Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wider text-slate-400">
                Contrasena
              </label>
              <div className="group relative">
                <Lock className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200 ${focusedField === "password" ? "text-[#2b2bee]" : "text-slate-500"}`} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className="h-12 w-full rounded-xl border border-slate-700 bg-slate-900/50 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 transition-all duration-200 focus:border-[#2b2bee]/40 focus:bg-slate-900 focus:outline-none focus:shadow-[0_0_0_3px_rgba(43,43,238,0.12)]"
                />
              </div>
            </div>

            {/* Error */}
            {state.error ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {state.error}
              </div>
            ) : null}

            {/* Boton submit */}
            <button
              type="submit"
              disabled={pending}
              className="group relative mt-2 flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#2b2bee] to-[#1e1ebd] text-sm font-semibold text-white shadow-[0_4px_20px_rgba(43,43,238,0.25)] transition-all duration-200 hover:shadow-[0_6px_30px_rgba(43,43,238,0.4)] hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              {/* Shimmer animado */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">
                {pending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando...
                  </span>
                ) : (
                  "Iniciar sesion"
                )}
              </span>
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-[11px] text-white/20">
          Sistema de Administracion de Clubes &middot; Iglesia Adventista
        </p>
        <div className="mx-auto mt-3 flex items-center justify-center gap-1.5">
          <div className="h-1 w-1 rounded-full bg-[#2b2bee]/40" />
          <div className="h-1 w-6 rounded-full bg-[#2b2bee]/30" />
          <div className="h-1 w-1 rounded-full bg-[#2b2bee]/40" />
        </div>
      </div>
    </div>
  );
}
