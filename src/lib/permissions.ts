import type { AdminPermission, NavItem, Role, User } from "@/types/user";

export const roleLabels: Record<Role, string> = {
  exporter: "Exportador",
  transitario: "Transitário",
  agente_maritimo: "Agente marítimo",
  agente_recolha: "Agente de recolha",
  cv_operator: "Operador do terminal",
  alfandega: "Alfândega",
  portaria: "Portaria",
  agente_destino: "Agência em Cabo Verde",
  tecnico_dgtr: "Técnico da DGTR",
  cliente: "Cliente",
  admin: "Administrador da plataforma",
  super_admin: "Super admin",
};

export const adminPermissionLabels: Record<AdminPermission, string> = {
  dashboard: "Painel geral",
  activity: "Registo de atividade",
  feedback: "Problemas reportados",
  users: "Utilizadores da equipa (sem administradores)",
  agencies: "Agências e ligações",
  tariffs: "Tarifas e prazo de abandono",
  operations: "Consultar as operações",
};

export const isAdminRole = (role: Role | undefined) => role === "admin" || role === "super_admin";

/** Menus da administração e a permissão que cada um exige ao admin da plataforma (o super admin vê todos). */
const administration: Array<NavItem & { permission: AdminPermission | "super_admin" | "write" }> = [
  { label: "Painel geral", href: "/dashboard", icon: "dashboard", permission: "dashboard" },
  { label: "Utilizadores", href: "/admin/users", icon: "users", permission: "users" },
  { label: "Perfis de administração", href: "/admin/perfis", icon: "key", permission: "super_admin" },
  { label: "Agências", href: "/admin/agencias", icon: "building", permission: "agencies" },
  { label: "Pedidos de clientes", href: "/agencia/pedidos", icon: "inbox", permission: "operations" },
  { label: "Encomendas", href: "/agencia/encomendas", icon: "boxes", permission: "operations" },
  // Importar cria encomendas: só para quem opera.
  { label: "Importar lista", href: "/agencia/importar", icon: "upload", permission: "write" },
  { label: "Contentores", href: "/agencia/contentores", icon: "container", permission: "operations" },
  { label: "Viagens e manifestos", href: "/agencia/viagens", icon: "anchor", permission: "operations" },
  { label: "Chegadas e conferência", href: "/cv/chegadas", icon: "scan", permission: "operations" },
  { label: "Despacho aduaneiro", href: "/alfandega", icon: "stamp", permission: "operations" },
  { label: "Viaturas (desalfandegamento)", href: "/alfandega/viaturas", icon: "car", permission: "operations" },
  { label: "Inspeção e matrícula (DGTR)", href: "/dgtr", icon: "car", permission: "operations" },
  { label: "Levantamentos", href: "/portaria", icon: "door", permission: "operations" },
  { label: "Agências em Cabo Verde", href: "/agencia-cv", icon: "map-pin", permission: "operations" },
  { label: "Tarifas", href: "/admin/tarifas", icon: "receipt", permission: "tariffs" },
  { label: "Registo de atividade", href: "/admin/auditoria", icon: "shield", permission: "activity" },
  { label: "Problemas reportados", href: "/admin/problemas", icon: "bug", permission: "feedback" },
  { label: "Bloqueios", href: "/admin/bloqueios", icon: "lock", permission: "super_admin" },
];

const nav = (items: typeof administration): NavItem[] => items.map(({ label, href, icon }) => ({ label, href, icon }));

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
  alfandega: [
    { label: "Despacho aduaneiro", href: "/alfandega", icon: "stamp" },
    { label: "Viaturas", href: "/alfandega/viaturas", icon: "car" },
  ],
  tecnico_dgtr: [{ label: "Inspeção e matrícula", href: "/dgtr", icon: "car" }],
  portaria: [{ label: "Levantamentos", href: "/portaria", icon: "door" }],
  agente_destino: [
    { label: "Encomendas a entregar", href: "/agencia-cv", icon: "boxes" },
    { label: "Entregar ao destinatário", href: "/agencia-cv/entregar", icon: "door" },
  ],
  cliente: [
    { label: "Os meus pedidos", href: "/cliente", icon: "inbox" },
    { label: "As minhas viaturas", href: "/cliente/viaturas", icon: "car" },
  ],
  // O admin da plataforma vê só os menus das permissões do seu perfil (navigationFor).
  admin: nav(administration.filter((item) => item.permission !== "super_admin" && item.permission !== "write")),
  super_admin: nav(administration),
};

type NavUser = Pick<User, "role" | "permissions">;

/** Menus da conta: o admin da plataforma só vê as áreas do seu perfil de administração. */
export function navigationFor(user: NavUser): NavItem[] {
  if (user.role !== "admin") return roleNavigation[user.role];
  const permissions = user.permissions ?? [];
  return nav(administration.filter((item) => permissions.includes(item.permission)));
}

/** O admin da plataforma só consulta as operações: os ecrãs escondem os botões que alteram. */
export const isReadOnly = (user: Pick<User, "role"> | null | undefined) => user?.role === "admin";

export const defaultRouteByRole: Record<Role, string> = {
  exporter: "/exportador",
  transitario: "/agencia/viagens",
  agente_maritimo: "/cv/chegadas",
  agente_recolha: "/agent/collections",
  cv_operator: "/cv/chegadas",
  alfandega: "/alfandega",
  portaria: "/portaria",
  agente_destino: "/agencia-cv",
  tecnico_dgtr: "/dgtr",
  cliente: "/cliente",
  admin: "/dashboard",
  super_admin: "/dashboard",
};

/** Página inicial depois de entrar; o admin vai para a primeira área do seu perfil. */
export function defaultRouteFor(user: NavUser) {
  return user.role === "admin" ? (navigationFor(user)[0]?.href ?? "/unauthorized") : defaultRouteByRole[user.role];
}

export const isAllowedRoute = (user: NavUser, href: string) =>
  navigationFor(user).some((item) => item.href === href || href.startsWith(`${item.href}/`));
