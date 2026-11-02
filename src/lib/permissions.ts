import type { NavItem, Role } from "@/types/user";

export const roleLabels: Record<Role, string> = {
  exporter: "Exportador",
  transitario: "Transitário",
  agente_maritimo: "Agente marítimo",
  agente_recolha: "Agente de recolha",
  cv_operator: "Operador CV",
  cliente: "Cliente",
  admin: "Administrador",
};

export const roleNavigation: Record<Role, NavItem[]> = {
  exporter: [
    { label: "Painel geral", href: "/dashboard", icon: "dashboard" },
    { label: "Painel de exportação", href: "/exporter/dashboard", icon: "globe" },
    { label: "Exportadores", href: "/exporter/companies", icon: "building" },
    { label: "Destinatários", href: "/exporter/consignees", icon: "map-pin" },
    { label: "Carga", href: "/exporter/cargo", icon: "package" },
    { label: "Embarques", href: "/exporter/shipments", icon: "ship" },
    { label: "Volumes", href: "/exporter/volumes", icon: "boxes" },
    { label: "Contentores", href: "/exporter/containers", icon: "container" },
    { label: "BL", href: "/exporter/bl", icon: "file-text" },
    { label: "Manifestos", href: "/exporter/manifestos", icon: "clipboard-list" },
  ],
  transitario: [
    { label: "Painel geral", href: "/dashboard", icon: "dashboard" },
    { label: "Embarques", href: "/exporter/shipments", icon: "ship" },
    { label: "Contentores", href: "/exporter/containers", icon: "container" },
    { label: "BL", href: "/exporter/bl", icon: "file-text" },
  ],
  agente_maritimo: [
    { label: "Painel geral", href: "/dashboard", icon: "dashboard" },
    { label: "Navios", href: "/cv/navios", icon: "ship" },
    { label: "Gate Pass", href: "/cv/gate-pass", icon: "door" },
    { label: "Conferência", href: "/cv/conferencia", icon: "check" },
  ],
  agente_recolha: [
    { label: "Recolhas", href: "/agent/collections", icon: "package" },
    { label: "Nova recolha", href: "/agent/collections/new", icon: "plus" },
    { label: "Pedidos de clientes", href: "/agencia/pedidos", icon: "inbox" },
  ],
  cv_operator: [
    { label: "Painel geral", href: "/dashboard", icon: "dashboard" },
    { label: "Navios", href: "/cv/navios", icon: "ship" },
    { label: "Contra-Marca", href: "/cv/contra-marca", icon: "tag" },
    { label: "Gate Pass", href: "/cv/gate-pass", icon: "door" },
    { label: "Auditoria", href: "/cv/auditoria", icon: "shield" },
  ],
  cliente: [
    { label: "Os meus pedidos", href: "/cliente", icon: "inbox" },
  ],
  admin: [
    { label: "Painel geral", href: "/dashboard", icon: "dashboard" },
    { label: "Utilizadores", href: "/admin/users", icon: "users" },
    { label: "Pedidos de clientes", href: "/agencia/pedidos", icon: "inbox" },
    { label: "Exportação", href: "/exporter/dashboard", icon: "globe" },
    { label: "Operações CV", href: "/cv/navios", icon: "ship" },
    { label: "Auditoria", href: "/cv/auditoria", icon: "shield" },
  ],
};

export const defaultRouteByRole: Record<Role, string> = {
  exporter: "/exporter/dashboard",
  transitario: "/dashboard",
  agente_maritimo: "/cv/navios",
  agente_recolha: "/agent/collections",
  cv_operator: "/cv/navios",
  cliente: "/cliente",
  admin: "/admin/users",
};

export const isAllowedRoute = (role: Role, href: string) => {
  const allowed = roleNavigation[role].map((item) => item.href);

  return allowed.some((allowedPath) => {
    if (allowedPath === href) {
      return true;
    }

    return href.startsWith(`${allowedPath}/`);
  });
};
