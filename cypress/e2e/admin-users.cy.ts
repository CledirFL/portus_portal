const demoPassword = "PortusDemo!2026-CV";

function field(label: string) {
  return cy.contains("label > span", new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`)).parent().find("input, select, textarea").first();
}

function logIn(email: string, password: string, landing: string) {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.visit("/login");
  cy.get('[data-cy="login-form"]').should("have.attr", "data-hydrated", "true");
  cy.get("#email").type(email);
  cy.get("#password").type(password, { log: false });
  cy.contains("button", "Entrar").click();
  cy.location("pathname", { timeout: 60_000 }).should("eq", landing);
}

/** Espera pelo email no Mailpit (o backend envia em segundo plano, a cada 10 s). */
function waitForEmail(to: string, subject: RegExp, attempts = 20): Cypress.Chainable<unknown> {
  return cy.request(`http://localhost:8025/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`).then((response) => {
    const message = (response.body.messages as Array<{ Subject: string }>).find((item) => subject.test(item.Subject));
    if (message) return cy.wrap(message);
    if (attempts <= 1) throw new Error(`Email "${subject}" para ${to} não chegou ao Mailpit.`);
    return cy.wait(2000).then(() => waitForEmail(to, subject, attempts - 1));
  });
}

describe("gestão de utilizadores", () => {
  it("approves an access request and creates a staff account with a temporary password", () => {
    const suffix = String(Date.now()).slice(-6);
    const requester = `alfandega.${suffix}@example.cv`;
    const staff = `agente.${suffix}@example.pt`;

    // Pedir acesso.
    cy.visit("/register");
    field("Nome completo").type("Nuno Lopes");
    field("Email profissional").type(requester);
    field("Telefone").clear().type("+238 991 00 11");
    field("Empresa ou entidade").type("Alfândega da Praia");
    field("Perfil").select("Alfândega");
    field("Palavra-passe").type("segredo123");
    field("Confirmar palavra-passe").type("segredo123");
    cy.get('input[type="checkbox"]').check();
    cy.contains("button", "Pedir acesso").click();
    cy.get('[data-cy="access-requested"]').should("contain.text", requester);
    waitForEmail(requester, /Recebemos o seu pedido de acesso/);

    // Administrador: aprova com o porto.
    logIn("joao@portus.cv", demoPassword, "/admin/users");
    cy.contains('[role="tab"]', "Pedidos de acesso").click();
    cy.contains("tr", requester, { timeout: 60_000 }).find("a").click();
    cy.contains("Empresa ou entidade: Alfândega da Praia", { timeout: 60_000 }).should("be.visible");
    cy.contains("button", "Aprovar").click();
    cy.contains("Escolha o porto deste utilizador.").should("be.visible");
    field("Porto").select("Porto da Praia · Santiago");
    cy.contains("button", "Aprovar").click();
    cy.contains("Conta aprovada. A pessoa recebeu um email.").should("be.visible");
    cy.screenshot("11-utilizador-aprovado", { capture: "fullPage" });
    waitForEmail(requester, /A sua conta PORTUS está ativa/);

    // Administrador: nova conta da equipa.
    cy.visit("/admin/users/nova");
    field("Nome").type("Rui Agente");
    field("Email").type(staff);
    field("Perfil").select("Agente de recolha");
    field("Agência").find("option").contains("Morabeza Envios").then((option) => {
      field("Agência").select(String(option.val()));
    });
    cy.contains("button", "Criar conta").click();
    cy.screenshot("12-conta-criada", { capture: "fullPage" });
    cy.get('[data-cy="temporary-password"]')
      .find(".font-mono")
      .invoke("text")
      .then((temporaryPassword) => {
        logIn(requester, "segredo123", "/alfandega");
        logIn(staff, String(temporaryPassword), "/agent/collections");
      });

    // Auditoria: a aprovação fica registada com o antes e o depois.
    logIn("joao@portus.cv", demoPassword, "/admin/users");
    cy.visit("/admin/auditoria");
    field("Ação").type("user.approve");
    cy.contains("button", "Filtrar").click();
    cy.get('[data-cy="audit-table"]', { timeout: 60_000 }).should("not.contain.text", "user.create").and("not.contain.text", "shipment.");
    cy.get('[data-cy="audit-table"] tbody tr').first().click();
    cy.get('[data-cy="audit-table"]').should("contain.text", "user.approve").and("contain.text", "review").and("contain.text", "active");
    cy.screenshot("13-auditoria", { capture: "fullPage" });

    // Painel com dados reais.
    cy.visit("/dashboard");
    cy.get('[data-cy="dashboard"]', { timeout: 60_000 }).should("contain.text", "Volumes por estado").and("contain.text", "Por levantar").and("contain.text", "Embarcado").and("contain.text", "Chegado");
    cy.screenshot("14-painel", { capture: "fullPage" });
  });
});
