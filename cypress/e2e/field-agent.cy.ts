const agentEmail = "agente@portus.cv";
const demoPassword = "PortusDemo!2026-CV";
const imageContents =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/r9sAAAAASUVORK5CYII=";

function logInAsAgent() {
  cy.get("#email").type(agentEmail);
  cy.get("#password").type(demoPassword);
  cy.get("#email").should("have.value", agentEmail);
  cy.get("#password").should("have.value", demoPassword);
  cy.contains("button", "Entrar").click();
  cy.window().should((browserWindow) => {
    const persisted = JSON.parse(browserWindow.localStorage.getItem("portus-auth") ?? "{}");
    expect(persisted.state?.user?.email).to.equal(agentEmail);
    expect(persisted.state?.user?.role).to.equal("agente_recolha");
  });
  cy.location("pathname").should("eq", "/agent/collections");
}

function addTestPhoto() {
  cy.get('[data-cy="collection-photo"]').selectFile({
    contents: Cypress.Buffer.from(imageContents, "base64"),
    fileName: "etiqueta-encomenda.png",
    mimeType: "image/png",
  });
}

describe("recolhas do agente no terreno", () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.visit("/login", {
      onBeforeLoad: (browserWindow) => browserWindow.localStorage.clear(),
    });
    cy.get('[data-cy="login-form"]').should("have.attr", "data-hydrated", "true");
    cy.window().then(
      (browserWindow) =>
        new Cypress.Promise<void>((resolve, reject) => {
          const request = browserWindow.indexedDB.deleteDatabase("portus-field-agent");
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
          request.onblocked = () => reject(new Error("A base de dados de teste está bloqueada."));
        }),
    );
  });

  it("requires login and restricts collection pages to the agent role", () => {
    cy.visit("/agent/collections");
    cy.location("pathname").should("eq", "/login");

    cy.get("#email").type("ana@portus.cv");
    cy.get("#password").type(demoPassword);
    cy.contains("button", "Entrar").click();
    cy.location("pathname").should("eq", "/exporter/dashboard");

    cy.visit("/agent/collections");
    cy.location("pathname").should("eq", "/unauthorized");
  });

  it("captures a photo, reviews OCR suggestions, corrects the data and persists the collection", () => {
    logInAsAgent();
    cy.contains("Ainda não existem recolhas neste navegador.").should("be.visible");
    cy.contains("a", "Nova recolha").click();

    addTestPhoto();
    cy.get("img[alt='Pré-visualização da fotografia da encomenda']").should("be.visible");
    cy.get('[data-cy="read-photo"]').click();

    cy.get('[data-cy="ocr-result"]').should("contain.text", "Texto reconhecido");
    cy.get('[data-cy="sender-name"]').should("have.value", "Atlantic Exports");
    cy.get('[data-cy="recipient-name"]').should("have.value", "Maria Lopes OCR");
    cy.get('[data-cy="recipient-document-number"]').should("have.value", "123456789");
    cy.get('[data-cy="weight-kg"]').should("have.value", "2.5");
    cy.get('[data-cy="volume-m3"]').should("have.value", "0.12");
    cy.get('[data-cy="save-collection"]').should("be.disabled");

    cy.get('[data-cy="recipient-name"]').clear().type("Maria Lopes");
    cy.get('[data-cy="review-confirmation"]').check();
    cy.get('[data-cy="save-collection"]').should("be.enabled").click();

    cy.location("pathname").should("eq", "/agent/collections");
    cy.get('[data-cy="collection-record"]')
      .should("contain.text", "Maria Lopes")
      .and("contain.text", "Roupa")
      .and("contain.text", "Confirmado pelo agente")
      .and("contain.text", "etiqueta-encomenda.png");

    cy.reload();
    cy.get('[data-cy="collection-record"]').should("contain.text", "Maria Lopes");
  });

  it("blocks confirmation when the recipient NIF or package measurements are invalid", () => {
    logInAsAgent();
    cy.contains("a", "Nova recolha").click();
    addTestPhoto();

    cy.get('[data-cy="sender-name"]').type("Atlantic Exports");
    cy.get('[data-cy="sender-phone"]').type("+351 912 345 678");
    cy.get('[data-cy="recipient-name"]').type("Maria Lopes");
    cy.get('[data-cy="recipient-document-number"]').type("1234");
    cy.get('[data-cy="recipient-phone"]').type("+238 991 112 233");
    cy.get('[data-cy="content-description"]').type("Roupa");
    cy.get('[data-cy="weight-kg"]').type("2.5");
    cy.get('[data-cy="review-confirmation"]').check();
    cy.get('[data-cy="save-collection"]').click();

    cy.contains("O NIF deve conter 9 algarismos.").should("be.visible");
    cy.contains("Indique o volume ou as três dimensões da encomenda.").should("be.visible");
    cy.contains("Ainda não existem recolhas neste navegador.").should("not.exist");
  });
});
