"use client";

import type { LucideIcon } from "lucide-react";
import {
  Users,
  Shield,
  ClipboardCheck,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ─── Datos ─── */
const stats: {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: LucideIcon;
}[] = [
  { label: "Usuarios registrados", value: "2,847", change: "+12.5%", trend: "up", icon: Users },
  { label: "Clubes activos", value: "156", change: "+8.2%", trend: "up", icon: Shield },
  { label: "Aprobaciones pendientes", value: "23", change: "-4.1%", trend: "down", icon: ClipboardCheck },
  { label: "Certificaciones", value: "1,205", change: "+15.3%", trend: "up", icon: GraduationCap },
];

const chartData = [
  { month: "Ene", users: 120 },
  { month: "Feb", users: 190 },
  { month: "Mar", users: 340 },
  { month: "Abr", users: 280 },
  { month: "May", users: 380 },
  { month: "Jun", users: 450 },
  { month: "Jul", users: 520 },
  { month: "Ago", users: 480 },
  { month: "Sep", users: 600 },
  { month: "Oct", users: 710 },
  { month: "Nov", users: 680 },
  { month: "Dic", users: 820 },
];

const membersByType = [
  { type: "Aventureros", count: 892, color: "#2b2bee", total: 2847 },
  { type: "Conquistadores", count: 1205, color: "#7c3aed", total: 2847 },
  { type: "Guías Mayores", count: 456, color: "#06b6d4", total: 2847 },
  { type: "Instructores", count: 294, color: "#22c55e", total: 2847 },
];

const recentRegistrations = [
  { name: "Carlos Mendoza", role: "Conquistador", club: "Conquistadores del Sur", status: "activo", time: "Hace 2 hrs" },
  { name: "María García", role: "Aventurero", club: "Exploradores Norte", status: "pendiente", time: "Hace 5 hrs" },
  { name: "José Rodríguez", role: "Guía Mayor", club: "Guías del Valle", status: "activo", time: "Hace 1 día" },
  { name: "Ana López", role: "Instructora", club: "Conquistadores Centro", status: "pendiente", time: "Hace 1 día" },
  { name: "Diego Herrera", role: "Conquistador", club: "Aventureros del Este", status: "activo", time: "Hace 2 días" },
];

/* ─── Tooltip personalizado ─── */
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3.5 py-2.5 shadow-xl">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-foreground">{payload[0].value}</p>
    </div>
  );
}

/* ─── Página de Dashboard ─── */
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Bienvenido de vuelta — aquí tienes el resumen del sistema.</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/20"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Icon size={18} className="text-primary" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <div className="mt-2 flex items-center gap-1 text-xs font-medium">
                  {stat.trend === "up" ? (
                    <>
                      <TrendingUp size={14} className="text-emerald-500" />
                      <span className="text-emerald-500">{stat.change}</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown size={14} className="text-red-500" />
                      <span className="text-red-500">{stat.change}</span>
                    </>
                  )}
                  <span className="text-muted-foreground ml-1">vs mes anterior</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fila de gráficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Gráfico de área — Registros de usuarios */}
        <div className="col-span-2 rounded-xl border border-border bg-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Registros de usuarios</h3>
              <p className="text-xs text-muted-foreground">Nuevos registros mensuales este año</p>
            </div>
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Este año
              <ArrowUpRight size={12} />
            </button>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2b2bee" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2b2bee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#2b2bee"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Miembros por tipo de club */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-1 text-lg font-semibold text-foreground">Miembros por tipo</h3>
          <p className="mb-6 text-xs text-muted-foreground">Distribución por tipo de club</p>
          <div className="space-y-5">
            {membersByType.map((item) => (
              <div key={item.type}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">{item.type}</span>
                  <span className="text-sm font-bold text-foreground">{new Intl.NumberFormat("es-MX").format(item.count)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(item.count / item.total) * 100}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla de registros recientes */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Registros recientes</h3>
            <p className="text-xs text-muted-foreground">Últimas inscripciones de miembros en todos los clubes</p>
          </div>
          <button
            type="button"
            className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            Ver todos
            <ArrowUpRight size={12} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 font-medium text-muted-foreground">Nombre</th>
                <th className="pb-3 font-medium text-muted-foreground">Rol</th>
                <th className="pb-3 font-medium text-muted-foreground">Club</th>
                <th className="pb-3 font-medium text-muted-foreground">Estado</th>
                <th className="pb-3 text-right font-medium text-muted-foreground">Tiempo</th>
              </tr>
            </thead>
            <tbody>
              {recentRegistrations.map((reg) => (
                <tr key={reg.name} className="border-b border-border/50 last:border-0">
                  <td className="py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        {reg.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <span className="font-medium text-foreground">{reg.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 text-muted-foreground">{reg.role}</td>
                  <td className="py-3.5 text-muted-foreground">{reg.club}</td>
                  <td className="py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        reg.status === "activo"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-amber-500/10 text-amber-500"
                      }`}
                    >
                      {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3.5 text-right text-muted-foreground">{reg.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
