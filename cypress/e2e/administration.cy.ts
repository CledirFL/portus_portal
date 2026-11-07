const demoPassword = "PortusDemo!2026-CV";
const apiUrl = "http://localhost:4000/api";

type Headers = { authorization: string };

function headersFor(email: string, password = demoPassword) {
  return cy
    .request("POST", `${apiUrl}/auth/login`, { email, password })
    .then((login) => ({ authorization: `Bearer ${login.body.accessToken as string}` }) as Headers);
}

const call = (headers: Headers, method: string, url: string, body?: object) => cy.request({ method, url: `${apiUrl}${url}`, headers, body });

function logIn(email: string, password: string, landing: string) {
  cy.visit("/login", { onBeforeLoad: (browserWindow) => browserWindow.localStorage.clear() });
  cy.get('[data-cy="login-form"]').should("have.attr", "data-hydrated", "true");
  cy.get("#email").type(email);
  cy.get("#password").type(password, { log: false });
  cy.contains("button", "Entrar").click();
  cy.location("pathname", { timeout: 60_000 }).should("eq", landing);
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function field(label: string) {
  return cy
    .contains("label > span", new RegExp(`^${escapeRegExp(label)}$`))
    .parent()
    .find("input, select, textarea")
    .first();
}

/** Retoma sempre os novos pedidos, mesmo que o teste falhe a meio (a base de dados é a de desenvolvimento). */
function resumeRequests() {
  headersFor("joao@portus.cv").then((owner) => call(owner, "PUT", "/admin/blocks/processes/requests", { blocked: false }));
}

describe("super admin, perfis de administração, registo de atividade e bloqueios", () => {
  after(resumeRequests);

  it("gives a platform admin only the areas of the profile, read-only, and lets the super admin stop a process", () => {
    const suffix = String(Date.now()).slice(-6);
    const email = `governo.${suffix}@example.cv`;
    const profileName = `Supervisão E2E ${suffix}`;

    // Super admin (API): perfil com painel, registo de atividade e operações; conta de admin com esse perfil.
    headersFor("joao@portus.cv").then((owner) => {
      call(owner, "POST", "/admin/profiles", { name: profileName, permissions: ["dashboard", "activity", "operations"] }).then((profile) => {
        call(owner, "POST", "/users", { name: "Marta Supervisão", email, role: "admin", adminProfileId: profile.body.id }).then((created) => {
          const temporaryPassword = created.body.temporaryPassword as string;

          // Uma entrada falhada fica no registo de atividade.
          cy.request({ method: "POST", url: `${apiUrl}/auth/login`, body: { email, password: "errada-errada" }, failOnStatusCode: false })
            .its("status")
            .should("eq", 401);

          // Admin da plataforma: só os menus do perfil e as operações em modo de consulta.
          logIn(email, temporaryPassword, "/dashboard");
          cy.get("nav").should("contain.text", "Painel geral").and("contain.text", "Encomendas").and("contain.text", "Registo de atividade");
          cy.get("nav").should("not.contain.text", "Utilizadores").and("not.contain.text", "Bloqueios").and("not.contain.text", "Perfis de administração");
          cy.get("nav").contains("a", "Encomendas").click();
          cy.get('[data-cy="read-only-banner"]', { timeout: 60_000 }).should("contain.text", "Modo de consulta").and("contain.text", profileName);
          cy.contains("button", "Nova encomenda").should("not.exist");
          cy.visit("/admin/bloqueios");
          cy.location("pathname", { timeout: 60_000 }).should("eq", "/unauthorized");

          // Registo de atividade: filtra as entradas falhadas e exporta o CSV.
          cy.visit("/admin/auditoria");
          field("Tipo").select("Sessão");
          field("Resultado").select("Falhado");
          field("Quem").type(email);
          cy.get('[data-cy="audit-filters"]').contains("button", "Filtrar").click();
          cy.get('[data-cy="audit-table"]', { timeout: 60_000 }).should("contain.text", "Entrada falhada").and("contain.text", "Marta Supervisão");
          // Espera pelo resultado do filtro (só a entrada falhada desta conta) antes de abrir o detalhe.
          cy.get('[data-cy="audit-table"] tbody tr').should("have.length", 1).click();
          cy.get('[data-cy="audit-table"]').should("contain.text", "POST /api/auth/login").and("contain.text", "Navegador");
          cy.screenshot("b10-registo-de-atividade", { capture: "fullPage" });
          cy.get('[data-cy="audit-export"]').click();
          cy.readFile(`cypress/downloads/registo-de-atividade-${new Date().toISOString().slice(0, 10)}.csv`, { timeout: 30_000 }).should(
            "contain",
            "session.login_failed",
          );

          // Super admin: vê o perfil com a conta e para os novos pedidos; o aviso aparece no portal.
          logIn("joao@portus.cv", demoPassword, "/dashboard");
          cy.get("nav").contains("a", "Perfis de administração").click();
          cy.contains('[data-cy="admin-profiles"] > *', profileName, { timeout: 60_000 }).should("contain.text", "Marta Supervisão").and("contain.text", "Consultar as operações");
          cy.get("nav").contains("a", "Bloqueios").click();
          cy.get('[data-cy="process-requests"]', { timeout: 60_000 }).within(() => {
            cy.contains("button", "Parar").click();
            field("Aviso a mostrar (opcional)").type(`Novos pedidos suspensos (teste ${suffix}).`);
            cy.contains("button", "Confirmar").click();
            cy.contains("Parado").should("be.visible");
          });
          cy.reload();
          cy.get('[data-cy="platform-status"]', { timeout: 60_000 }).should("contain.text", `Novos pedidos suspensos (teste ${suffix}).`);
          cy.screenshot("b10-bloqueios", { capture: "fullPage" });
          cy.get('[data-cy="process-requests"]').contains("button", "Retomar").click();
          cy.get('[data-cy="process-requests"]').should("contain.text", "A funcionar");
        });
      });
    });
  });
});
