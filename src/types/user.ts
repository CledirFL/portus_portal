export type Role =
  | "exporter"
  | "transitario"
  | "agente_maritimo"
  | "agente_recolha"
  | "cv_operator"
  | "alfandega"
  | "portaria"
  | "agente_destino"
  | "cliente"
  | "admin"
  | "super_admin";

/** Áreas de administração (o super admin tem todas; o admin as do seu perfil de administração). */
export type AdminPermission = "dashboard" | "activity" | "feedback" | "users" | "agencies" | "tariffs" | "operations";

export type UserStatus = "active" | "review" | "blocked";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  company: string;
  status?: UserStatus;
  lastActive?: string;
  createdAt?: string;
  /** Áreas de administração desta conta (AdminPermission; vazio fora da administração). */
  permissions?: string[];
  /** Perfil de administração (só no admin). */
  adminProfile?: { id: string; name: string } | null;
  department?: string;
  region?: string;
  /** Agência a que o utilizador pertence (âmbito de dados, BR 28). */
  agencyId?: string;
  /** Porto de chegada do utilizador (terminal, Alfândega, portaria). */
  portId?: string;
  phone?: string;
}

export type NavIcon =
  | "bug"
  | "lock"
  | "key"
  | "dashboard"
  | "globe"
  | "building"
  | "users"
  | "map-pin"
  | "package"
  | "ship"
  | "boxes"
  | "container"
  | "file-text"
  | "clipboard-list"
  | "door"
  | "check"
  | "tag"
  | "shield"
  | "inbox"
  | "upload"
  | "anchor"
  | "scan"
  | "stamp"
  | "receipt"
  | "plus";

export interface NavItem {
  label: string;
  href: string;
  icon: NavIcon;
}
