import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  Boxes,
  BookOpen,
  Calendar,
  CalendarCheck,
  ClipboardCheck,
  Flower2,
  Globe,
  HeartPulse,
  Key,
  LayoutDashboard,
  Map,
  Medal,
  Settings,
  ShieldCheck,
  Sparkles,
  Tent,
  Trophy,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  children?: NavItem[];
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: "",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Aprobaciones", href: "/dashboard/approvals", icon: UserPlus, badge: 12 },
      { title: "Miembros", href: "/dashboard/users", icon: Users },
      {
        title: "Catálogos",
        href: "/dashboard/catalogs",
        icon: BookOpen,
        children: [
          { title: "Resumen", href: "/dashboard/catalogs", icon: BookOpen },
          { title: "Países", href: "/dashboard/catalogs/geography/countries", icon: Globe },
          { title: "Uniones", href: "/dashboard/catalogs/geography/unions", icon: Map },
          { title: "Campos locales", href: "/dashboard/catalogs/geography/local-fields", icon: Map },
          { title: "Distritos", href: "/dashboard/catalogs/geography/districts", icon: Map },
          { title: "Iglesias", href: "/dashboard/catalogs/geography/churches", icon: Map },
          { title: "Tipos de relación", href: "/dashboard/catalogs/relationship-types", icon: Users },
          { title: "Alergias", href: "/dashboard/catalogs/allergies", icon: Flower2 },
          { title: "Enfermedades", href: "/dashboard/catalogs/diseases", icon: HeartPulse },
          { title: "Años eclesiásticos", href: "/dashboard/catalogs/ecclesiastical-years", icon: Calendar },
          { title: "Tipos de club", href: "/dashboard/catalogs/club-types", icon: ShieldCheck },
          { title: "Ideales de club", href: "/dashboard/catalogs/club-ideals", icon: Sparkles },
        ],
      },
    ],
  },
  {
    label: "Organización",
    items: [
      { title: "Clubes", href: "/dashboard/clubs", icon: Users },
      { title: "Actividades", href: "/dashboard/activities", icon: CalendarCheck },
      { title: "Camporees", href: "/dashboard/camporees", icon: Tent },
      { title: "Clases", href: "/dashboard/classes", icon: ClipboardCheck },
      { title: "Honores", href: "/dashboard/honors", icon: Trophy },
      { title: "Certificaciones", href: "/dashboard/certifications", icon: Activity },
      { title: "Finanzas", href: "/dashboard/finances", icon: Wallet },
      { title: "Inventario", href: "/dashboard/inventory", icon: Boxes },
      { title: "Puntuación en vivo", href: "/dashboard/scoring", icon: Trophy },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        title: "Roles y permisos",
        href: "/dashboard/rbac",
        icon: ShieldCheck,
        children: [
          { title: "Matriz de seguridad", href: "/dashboard/rbac/matrix", icon: ShieldCheck },
          { title: "Catálogo de roles", href: "/dashboard/rbac/roles", icon: Key },
          { title: "Catálogo de permisos", href: "/dashboard/rbac/permissions", icon: BookOpen },
        ],
      },
      { title: "Notificaciones", href: "/dashboard/notifications", icon: Bell },
      { title: "Credenciales", href: "/dashboard/credentials", icon: Medal },
      { title: "Configuración", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export const navItems: NavItem[] = navGroups.flatMap((group) => group.items);
