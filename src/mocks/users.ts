import type { User } from "@/types/user";

export const mockUsers: User[] = [
  {
    id: "u-001",
    name: "Ana Silva",
    email: "ana@portus.cv",
    role: "exporter",
    company: "Atlantic Exports",
  },
  {
    id: "u-002",
    name: "Bruno Costa",
    email: "bruno@portus.cv",
    role: "transitario",
    company: "Maritime Logistics",
  },
  {
    id: "u-003",
    name: "Carla Mendes",
    email: "carla@portus.cv",
    role: "agente_maritimo",
    company: "Cabo Verde Ports",
  },
  {
    id: "u-004",
    name: "Duarte Nunes",
    email: "duarte@portus.cv",
    role: "cv_operator",
    company: "Enapor CV",
  },
  {
    id: "u-005",
    name: "João Pereira",
    email: "joao@portus.cv",
    role: "admin",
    company: "Portus Admin",
  },
];

export const mockPassword = "password123";
