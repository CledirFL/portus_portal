const demoPassword = "PortusDemo!2026-CV";

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Campo pelo texto exato da etiqueta. */
function field(label: string) {
  return cy
    .contains("label > span", new RegExp(`^${escapeRegExp(label)}$`))
    .parent()
    .find("input, select, textarea")
    .first();
}

function logInAsAgent() {
  cy.visit("/login", { onBeforeLoad: (browserWindow) => browserWindow.localStorage.clear() });
  cy.get('[data-cy="login-form"]').should("have.attr", "data-hydrated", "true");
  cy.get("#email").type("agente@portus.cv");
  cy.get("#password").type(demoPassword);
  cy.contains("button", "Entrar").click();
  cy.location("pathname").should("eq", "/agent/collections");
}

describe("importar lista da agência", () => {
  it("maps the columns, previews errors and imports the valid rows", () => {
    // Telefones únicos para não colidirem com importações de execuções anteriores (duplicados do mesmo dia).
    const suffix = String(Date.now()).slice(-6);
    const csv = [
      "Nº Guia;Remetente;Telefone remetente;Destinatário;Telefone destinatário;Ilha;Conteúdo;Peso (kg);Volume (m3)",
      `E2E-${suffix};Rosa Tavares;+351 912 ${suffix.slice(0, 3)} ${suffix.slice(3)};Maria Lopes;+238 991 22 33;São Vicente;Roupa;12,5;0,1`,
      `E2E-${suffix};Rosa Tavares;+351 912 ${suffix.slice(0, 3)} ${suffix.slice(3)};Maria Lopes;+238 991 22 33;São Vicente;Roupa;7;0,05`,
      `;Zé Pires;+351 915 ${suffix.slice(0, 3)} ${suffix.slice(3)};Nha Djon;991 22 33;Santiago;Livros;4;0,03`,
    ].join("\r\n");

    logInAsAgent();
    cy.visit("/agencia/importar");
    cy.get('[data-cy="import-file"]', { timeout: 30_000 }).selectFile(
      { contents: Cypress.Buffer.from(csv, "utf8"), fileName: "lista-e2e.csv", mimeType: "text/csv" },
      { force: true },
    );
    cy.contains("lista-e2e.csv").should("be.visible");
    cy.contains("button", "Carregar").click();

    cy.contains("h3", "Colunas de lista-e2e.csv").should("be.visible");
    field("Peso (kg) *").find("option:selected").should("contain.text", "Peso (kg)");
    field("Ilha de destino *").find("option:selected").should("contain.text", "Ilha");
    cy.contains("button", "Pré-visualizar").click();

    cy.get('[data-cy="import-report"]').within(() => {
      cy.contains('[data-cy="import-group"]', `E2E-${suffix}`).should("contain.text", "Válida").and("contain.text", "2 vol.");
      cy.contains('[data-cy="import-group"]', "Linha 4").should("contain.text", "Com erros").and("contain.text", 'coluna "Telefone destinatário"');
    });
    cy.screenshot("b4-pre-visualizacao", { capture: "fullPage" });

    cy.contains("button", "Importar 1 encomenda").click();
    cy.contains("1 encomendas importadas em rascunho.").should("be.visible");
    cy.get('[data-cy="import-report"] a').first().click();
    cy.contains("h2", /^ENC-/, { timeout: 30_000 }).should("be.visible");
    cy.contains("Volumes (2)").should("be.visible");
  });
});
