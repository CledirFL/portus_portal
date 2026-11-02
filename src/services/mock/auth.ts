import { createId, readCollection, writeCollection } from "@/data/browser-store";
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

// Contas de cliente da demo ficam no navegador para sobreviverem a um refresh.
// Apenas para demonstração: na Fase 5 isto passa para o servidor com hash.
const customerAccountsKey = "portus-customer-accounts";

interface CustomerAccount {
  user: User;
  password: string;
}

interface CustomerRegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export async function mockRegisterCustomer(payload: CustomerRegisterPayload) {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const email = payload.email.trim().toLowerCase();
  const accounts = readCollection<CustomerAccount>(customerAccountsKey);

  if (
    mockUsers.some((user) => user.email.toLowerCase() === email) ||
    accounts.some((account) => account.user.email === email)
  ) {
    throw new Error("Este email já tem conta. Entre com a sua palavra-passe.");
  }

  const user: User = {
    id: `cli-${createId()}`,
    name: payload.name.trim(),
    email,
    phone: payload.phone,
    role: "cliente",
    company: "Particular",
    status: "active",
    lastActive: "Agora",
    createdAt: new Date().toISOString().slice(0, 10),
  };

  writeCollection(customerAccountsKey, [...accounts, { user, password: payload.password }]);
  return { user, redirectTo: defaultRouteByRole.cliente };
}

export async function mockLogin(email: string, password: string) {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const customer = readCollection<CustomerAccount>(customerAccountsKey).find(
    (account) => account.user.email === email.trim().toLowerCase(),
  );
  if (customer) {
    if (customer.password !== password) {
      throw new Error("Palavra-passe incorreta.");
    }
    return { user: customer.user, redirectTo: defaultRouteByRole.cliente };
  }

  const user = mockUsers.find((entry) => entry.email.toLowerCase() === email.toLowerCase());
  const savedPassword = mockUserCredentials[email.toLowerCase()] ?? mockPassword;

  if (!user || password !== savedPassword) {
    throw new Error("Credenciais inválidas. Confirme o email e a palavra-passe.");
  }

  return {
    user,
    redirectTo: defaultRouteByRole[user.role],
  };
}
