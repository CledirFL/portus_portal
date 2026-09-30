export type Role =
  | "exporter"
  | "transitario"
  | "agente_maritimo"
  | "cv_operator"
  | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  company: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}
