const demoPassword = "PortusDemo!2026-CV";
const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

function logIn(email: string, landing: string) {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.visit("/login");
  cy.get('[data-cy="login-form"]').should("have.attr", "data-hydrated", "true");
  cy.get("#email").type(email);
  cy.get("#password").type(demoPassword, { log: false });
  cy.contains("button", "Entrar").click();
  cy.location("pathname", { timeout: 60_000 }).should("eq", landing);
}

describe("reportar problema", () => {
  it("lets the agent report a problem with a screenshot and the administrator resolve it", () => {
    const description = `Ao validar a encomenda aparece um erro (${Date.now()}).`;

    logIn("agente@portus.cv", "/agent/collections");
    cy.visit("/agencia/encomendas");
    cy.contains("button", "Reportar problema", { timeout: 60_000 }).click();
    cy.get('[data-cy="report-problem"]').within(() => {
      cy.contains("label", "Falta").click();
      cy.contains("Devia existir e não existe.").should("be.visible");
      cy.contains("label", "Erro").click();
      cy.get("textarea").type(description);
      cy.get("select").select("Alta");
      cy.get('input[type="file"]').selectFile({ contents: Cypress.Buffer.from(png, "base64"), fileName: "ecra.png", mimeType: "image/png" });
      cy.contains("button", "Enviar").click();
    });
    cy.get('[data-cy="problem-sent"]').should("contain.text", "Registámos o problema #");
    cy.screenshot("15-problema-reportado");

    logIn("joao@portus.cv", "/admin/users");
    cy.visit("/admin/problemas");
    cy.contains('[data-cy="problems-table"] tr', description, { timeout: 60_000 }).click();
    cy.contains("Página /agencia/encomendas").should("be.visible");
    cy.contains("button", "Ver captura de ecrã").click();
    cy.get('img[alt^="Captura do problema"]').should("be.visible");
    cy.get('[data-cy="problems-table"]').within(() => {
      cy.contains("label", "Estado").find("select").select("Resolvido");
      cy.get("textarea").type("Corrigido.");
      cy.contains("button", "Guardar").click();
      cy.contains("Guardado.").should("be.visible");
    });
    cy.screenshot("16-problema-resolvido", { capture: "fullPage" });
  });
});
