const demoPassword = "PortusDemo!2026-CV";

function waitForHydration(selector: string) {
  cy.get(`[data-cy="${selector}"]`).should("have.attr", "data-hydrated", "true");
}

function field(label: string) {
  return cy.contains("label", label).find("input, select, textarea").first();
}

describe("pedido de envio pelo cliente", () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.visit("/enviar", {
      onBeforeLoad: (browserWindow) => browserWindow.localStorage.clear(),
    });
    waitForHydration("request-wizard");
  });

  it("lets a guest request a shipment, track it, and the agency accept it", () => {
    cy.contains("label", "Caixa ou encomenda").click();
    cy.contains("button", "Continuar").click();
    cy.contains("Quantas caixas ou volumes? é obrigatório.").should("be.visible");
    cy.contains("Descreva brevemente").should("be.visible");

    field("Quantas caixas").type("3");
    field("Peso aproximado").type("40");
    field("Descrição curta").type("Roupa e alimentos secos");
    cy.screenshot("01-enviar-tipo-de-carga", { capture: "fullPage" });
    cy.contains("button", "Continuar").click();

    field("Ilha de destino").select("São Vicente");
    cy.contains("label", "Morabeza Envios").click();
    cy.contains("label", "Quero que recolham").click();
    cy.contains("button", "Continuar").click();
    cy.contains("Indique a morada de recolha.").should("be.visible");
    field("Morada de recolha").type("Rua Elias Garcia 10, Amadora");
    cy.screenshot("02-enviar-agencia", { capture: "fullPage" });
    cy.contains("button", "Continuar").click();

    cy.contains("Quem envia").parents("div.rounded-2xl").first().within(() => {
      field("Nome").type("Rosa Tavares");
      field("Telefone").clear().type("+351 912 345 678");
    });
    cy.contains("Quem recebe").parents("div.rounded-2xl").first().within(() => {
      field("Nome").type("Maria Lopes");
      field("Telefone").clear().type("991 22 33");
    });
    cy.contains("button", "Continuar").click();
    cy.contains("Inclua o indicativo do país").should("be.visible");
    cy.contains("Quem recebe").parents("div.rounded-2xl").first().within(() => {
      field("Telefone").clear().type("+238 991 22 33");
    });
    cy.contains("button", "Continuar").click();

    cy.contains("Resumo do pedido").should("be.visible");
    cy.contains("Recolha em Rua Elias Garcia 10, Amadora").should("be.visible");
    cy.screenshot("03-enviar-resumo", { capture: "fullPage" });
    cy.contains("button", "Enviar pedido à agência").click();

    cy.get('[data-cy="request-reference"]')
      .invoke("text")
      .should("match", /^PED-[A-Z2-9]{6}$/)
      .then((reference) => {
        cy.screenshot("04-enviar-sucesso", { capture: "fullPage" });

        cy.visit(`/acompanhar?codigo=${reference}`);
        waitForHydration("request-lookup");
        field("Telefone do remetente").clear().type("+238 991 22 33");
        cy.contains("button", "Procurar").click();
        cy.contains("Não encontrámos nenhum pedido").should("be.visible");

        field("Telefone do remetente").clear().type("+351912345678");
        cy.contains("button", "Procurar").click();
        cy.contains(String(reference)).should("be.visible");
        cy.contains("A agência ainda não analisou o pedido.").should("be.visible");
        cy.screenshot("05-acompanhar", { capture: "fullPage" });

        cy.visit("/login");
        cy.get('[data-cy="login-form"]').should("have.attr", "data-hydrated", "true");
        cy.get("#email").type("agente@portus.cv");
        cy.get("#password").type(demoPassword);
        cy.contains("button", "Entrar").click();
        cy.location("pathname").should("eq", "/agent/collections");

        cy.visit("/agencia/pedidos");
        cy.contains(String(reference)).should("be.visible");
        cy.contains("Rosa Tavares → São Vicente").should("be.visible");
        cy.screenshot("06-agencia-pedidos", { capture: "fullPage" });
        cy.contains("button", "Aceitar").click();
        cy.contains("button", /^Em curso/).click();
        cy.contains("button", "Agendar").click();
        cy.contains("Escolha a data e hora.").should("be.visible");
        field("Data e hora da recolha").type("2026-11-10T10:30");
        cy.contains("button", "Agendar").click();
        cy.contains("Marcado para").should("be.visible");

        cy.clearLocalStorage("portus-auth");
        cy.visit(`/acompanhar?codigo=${reference}`);
        waitForHydration("request-lookup");
        field("Telefone do remetente").clear().type("+351 912 345 678");
        cy.contains("button", "Procurar").click();
        cy.contains("Recolha marcada para").should("be.visible");
      });
  });

  it("creates an optional account and lists the request in the customer area", () => {
    cy.contains("label", "Carro, mota ou carrinha").click();
    field("Marca").type("Toyota");
    field("Modelo").type("Hilux");
    field("Descrição curta").type("Carrinha usada a gasóleo");
    cy.contains("button", "Continuar").click();

    cy.contains("label", "Djarfogo Cargas").click();
    cy.contains("button", "Continuar").click();

    cy.contains("Quem envia").parents("div.rounded-2xl").first().within(() => {
      field("Nome").type("Carlos Semedo");
      field("Telefone").clear().type("+351 933 222 111");
    });
    cy.contains("Quem recebe").parents("div.rounded-2xl").first().within(() => {
      field("Nome").type("Ana Semedo");
      field("Telefone").clear().type("+238 952 11 22");
    });
    cy.contains("button", "Continuar").click();

    cy.contains("label", "Criar conta para ver todos os meus envios").click();
    field("Email").type("carlos@example.com");
    field("Palavra-passe").type("segredo123");
    cy.contains("button", "Enviar pedido à agência").click();

    cy.contains("a", "Ver os meus pedidos").click();
    cy.location("pathname").should("eq", "/cliente");
    cy.contains("Carro, mota ou carrinha · para Ana Semedo, Santiago").should("be.visible");
    cy.screenshot("07-cliente-pedidos", { capture: "fullPage" });
  });
});
