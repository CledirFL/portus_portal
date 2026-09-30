import type { NavItem, Role } from "@/types/user";

export const roleNavigation: Record<Role, NavItem[]> = {
  exporter: [
    { label: "Dashboard", href: "/dashboard", icon: "▣" },
    { label: "Shipments", href: "/exporter/shipments", icon: "⛴" },
    { label: "Volumes", href: "/exporter/volumes", icon: "📦" },
    { label: "Containers", href: "/exporter/containers", icon: "📛" },
    { label: "BL", href: "/exporter/bl", icon: "📄" },
    { label: "Manifestos", href: "/exporter/manifestos", icon: "🧾" },
  ],
  transitario: [
    { label: "Dashboard", href: "/dashboard", icon: "▣" },
    { label: "Shipments", href: "/exporter/shipments", icon: "⛴" },
    { label: "Containers", href: "/exporter/containers", icon: "📛" },
    { label: "BL", href: "/exporter/bl", icon: "📄" },
  ],
  agente_maritimo: [
    { label: "Dashboard", href: "/dashboard", icon: "▣" },
    { label: "Navios", href: "/cv/navios", icon: "🚢" },
    { label: "Gate Pass", href: "/cv/gate-pass", icon: "🚪" },
    { label: "Conferência", href: "/cv/conferencia", icon: "✅" },
  ],
  cv_operator: [
    { label: "Dashboard", href: "/dashboard", icon: "▣" },
    { label: "Navios", href: "/cv/navios", icon: "🚢" },
    { label: "Contra-Marca", href: "/cv/contra-marca", icon: "🏷️" },
    { label: "Gate Pass", href: "/cv/gate-pass", icon: "🚪" },
    { label: "Auditoria", href: "/cv/auditoria", icon: "🧾" },
  ],
  admin: [
    { label: "Dashboard", href: "/dashboard", icon: "▣" },
    { label: "Exportador", href: "/exporter/dashboard", icon: "🌍" },
    { label: "CV", href: "/cv/navios", icon: "🇨🇻" },
    { label: "Auditoria", href: "/cv/auditoria", icon: "🧾" },
  ],
};

export const defaultRouteByRole: Record<Role, string> = {
  exporter: "/exporter/dashboard",
  transitario: "/dashboard",
  agente_maritimo: "/cv/navios",
  cv_operator: "/cv/navios",
  admin: "/dashboard",
};

export const isAllowedRoute = (role: Role, href: string) => {
  const allowed = roleNavigation[role].map((item) => item.href);
  return allowed.includes(href);
};
