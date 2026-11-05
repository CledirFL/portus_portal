export type Role =
  | "exporter"
  | "transitario"
  | "agente_maritimo"
  | "agente_recolha"
  | "cv_operator"
  | "alfandega"
  | "portaria"
  | "cliente"
  | "admin";

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
  permissions?: string[];
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
