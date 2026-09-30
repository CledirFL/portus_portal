import type { User } from "@/types/user";

export const mockUsers: User[] = [
  {
    id: "u-001",
    name: "Ana Silva",
    email: "ana@portus.cv",
    role: "exporter",
    company: "Atlantic Exports",
    status: "active",
    lastActive: "Há 2 horas",
    createdAt: "2024-01-12",
    permissions: ["Shipments", "Manifestos", "Documentação"],
  },
  {
    id: "u-002",
    name: "Bruno Costa",
    email: "bruno@portus.cv",
    role: "transitario",
    company: "Maritime Logistics",
    status: "review",
    lastActive: "Ontem",
    createdAt: "2024-02-25",
    permissions: ["Containers", "BL"],
  },
  {
    id: "u-003",
    name: "Carla Mendes",
    email: "carla@portus.cv",
    role: "agente_maritimo",
    company: "Cabo Verde Ports",
    status: "active",
    lastActive: "Há 45 minutos",
    createdAt: "2024-03-10",
    permissions: ["Navios", "Gate Pass"],
  },
  {
    id: "u-004",
    name: "Duarte Nunes",
    email: "duarte@portus.cv",
    role: "cv_operator",
    company: "Enapor CV",
    status: "blocked",
    lastActive: "Semana passada",
    createdAt: "2024-04-18",
    permissions: ["Auditoria", "Contra-Marca"],
  },
  {
    id: "u-005",
    name: "João Pereira",
    email: "joao@portus.cv",
    role: "admin",
    company: "Portus Admin",
    status: "active",
    lastActive: "Agora",
    createdAt: "2023-11-02",
    permissions: ["Administração", "Gestão de acessos", "Configuração"],
  },
];

export const mockUserRegistry = mockUsers.map((user) => ({
  ...user,
  department: user.role === "admin" ? "Operações globais" : user.role === "exporter" ? "Exportação" : "Logística",
  region: "Cabo Verde",
}));

export const mockPassword = "password123";
