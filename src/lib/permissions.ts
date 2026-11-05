import type { NavItem, Role } from "@/types/user";

export const roleLabels: Record<Role, string> = {
  exporter: "Exportador",
  transitario: "Transitário",
  agente_maritimo: "Agente marítimo",
  agente_recolha: "Agente de recolha",
  cv_operator: "Operador do terminal",
  alfandega: "Alfândega",
  portaria: "Portaria",
  cliente: "Cliente",
  admin: "Administrador",
};

export const roleNavigation: Record<Role, NavItem[]> = {
  // Os ecrãs de demonstração do exportador foram retirados: o transitário faz esse trabalho com dados reais.
  exporter: [{ label: "Início", href: "/exportador", icon: "globe" }],
  transitario: [
    { label: "Viagens e manifestos", href: "/agencia/viagens", icon: "ship" },
    { label: "Contentores", href: "/agencia/contentores", icon: "container" },
    { label: "Encomendas", href: "/agencia/encomendas", icon: "boxes" },
    { label: "Importar lista", href: "/agencia/importar", icon: "upload" },
  ],
  agente_maritimo: [{ label: "Chegadas", href: "/cv/chegadas", icon: "anchor" }],
  agente_recolha: [
    { label: "Recolhas", href: "/agent/collections", icon: "package" },
    { label: "Nova recolha", href: "/agent/collections/new", icon: "plus" },
    { label: "Pedidos de clientes", href: "/agencia/pedidos", icon: "inbox" },
    { label: "Encomendas", href: "/agencia/encomendas", icon: "boxes" },
    { label: "Importar lista", href: "/agencia/importar", icon: "upload" },
  ],
  cv_operator: [{ label: "Chegadas e conferência", href: "/cv/chegadas", icon: "scan" }],
  alfandega: [{ label: "Despacho aduaneiro", href: "/alfandega", icon: "stamp" }],
  portaria: [{ label: "Levantamentos", href: "/portaria", icon: "door" }],
  cliente: [
    { label: "Os meus pedidos", href: "/cliente", icon: "inbox" },
  ],
  admin: [
    { label: "Painel geral", href: "/dashboard", icon: "dashboard" },
    { label: "Utilizadores", href: "/admin/users", icon: "users" },
    { label: "Pedidos de clientes", href: "/agencia/pedidos", icon: "inbox" },
    { label: "Encomendas", href: "/agencia/encomendas", icon: "boxes" },
    { label: "Importar lista", href: "/agencia/importar", icon: "upload" },
    { label: "Contentores", href: "/agencia/contentores", icon: "container" },
    { label: "Viagens e manifestos", href: "/agencia/viagens", icon: "anchor" },
    { label: "Chegadas e conferência", href: "/cv/chegadas", icon: "scan" },
    { label: "Despacho aduaneiro", href: "/alfandega", icon: "stamp" },
    { label: "Levantamentos", href: "/portaria", icon: "door" },
    { label: "Tarifas", href: "/admin/tarifas", icon: "receipt" },
    { label: "Auditoria", href: "/cv/auditoria", icon: "shield" },
  ],
};

export const defaultRouteByRole: Record<Role, string> = {
  exporter: "/exportador",
  transitario: "/agencia/viagens",
  agente_maritimo: "/cv/chegadas",
  agente_recolha: "/agent/collections",
  cv_operator: "/cv/chegadas",
  alfandega: "/alfandega",
  portaria: "/portaria",
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
