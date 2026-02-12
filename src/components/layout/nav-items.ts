import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Calendar,
  ClipboardCheck,
  Flower2,
  Gauge,
  HeartPulse,
  Key,
  LayoutDashboard,
  Library,
  Map,
  Medal,
  Settings,
  ShieldCheck,
  Tent,
  Trophy,
  UserPlus,
  Users,
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
      { title: "Geografía", href: "/dashboard/catalogs/geography", icon: Map },
    ],
  },
  {
    label: "Catálogos",
    items: [
      { title: "Años eclesiásticos", href: "/dashboard/catalogs/ecclesiastical-years", icon: Calendar },
      { title: "Tipos de club", href: "/dashboard/catalogs/club-types", icon: Users },
      { title: "Enfermedades", href: "/dashboard/catalogs/diseases", icon: HeartPulse },
      { title: "Alergias", href: "/dashboard/catalogs/allergies", icon: Flower2 },
    ],
  },
  {
    label: "Organización",
    items: [
      { title: "Eventos y Camporees", href: "/dashboard/camporees", icon: Tent },
      { title: "Currículo", href: "/dashboard/classes", icon: ClipboardCheck },
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
      { title: "Credenciales", href: "/dashboard/credentials", icon: Medal },
      { title: "Configuración", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export const navItems: NavItem[] = navGroups.flatMap((group) => group.items);
