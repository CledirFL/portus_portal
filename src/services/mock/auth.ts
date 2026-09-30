import { defaultRouteByRole } from "@/lib/permissions";
import { mockPassword, mockUserCredentials, mockUsers } from "@/mocks/users";
import type { Role, User } from "@/types/user";

interface RegisterPayload {
  name: string;
  email: string;
  company: string;
  country: string;
  role: Role;
  taxId: string;
  password: string;
}

export async function mockRegister(payload: RegisterPayload) {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const normalizedEmail = payload.email.toLowerCase();
  const existingUser = mockUsers.find((user) => user.email.toLowerCase() === normalizedEmail);

  if (existingUser) {
    throw new Error("Este email já está registado. Experimente entrar na sua conta ou usar outro email.");
  }

  const createdUser: User = {
    id: `u-${Date.now()}`,
    name: payload.name,
    email: normalizedEmail,
    role: payload.role,
    company: payload.company,
    status: "review",
    lastActive: "Agora",
    createdAt: new Date().toISOString().slice(0, 10),
    permissions: [
      payload.role === "exporter" ? "Criação de exportações" : "Acesso ao portal",
      "Documentação",
      "Gestão geral",
    ],
    department: payload.country === "Cabo Verde" ? "Operações locais" : "Operações internacionais",
    region: payload.country,
  };

  mockUsers.push(createdUser);
  mockUserCredentials[normalizedEmail] = payload.password;

  return {
    user: createdUser,
    redirectTo: defaultRouteByRole[payload.role],
  };
}

export async function mockLogin(email: string, password: string) {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const user = mockUsers.find((entry) => entry.email.toLowerCase() === email.toLowerCase());
  const savedPassword = mockUserCredentials[email.toLowerCase()] ?? mockPassword;

  if (!user || password !== savedPassword) {
    throw new Error("Credenciais inválidas. Tente: ana@portus.cv / password123");
  }

  return {
    user,
    redirectTo: defaultRouteByRole[user.role],
  };
}
