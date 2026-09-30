import { defaultRouteByRole } from "@/lib/permissions";
import { mockPassword, mockUsers } from "@/mocks/users";

export async function mockLogin(email: string, password: string) {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const user = mockUsers.find(
    (entry) =>
      entry.email.toLowerCase() === email.toLowerCase() && password === mockPassword,
  );

  if (!user) {
    throw new Error("Credenciais inválidas. Tente: ana@portus.cv / password123");
  }

  return {
    user,
    redirectTo: defaultRouteByRole[user.role],
  };
}
