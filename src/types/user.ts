export type Role =
  | "exporter"
  | "transitario"
  | "agente_maritimo"
  | "agente_recolha"
  | "cv_operator"
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
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}
