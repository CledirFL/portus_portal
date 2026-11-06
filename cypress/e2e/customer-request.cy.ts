const demoPassword = "PortusDemo!2026-CV";

function waitForHydration(selector: string) {
  cy.get(`[data-cy="${selector}"]`).should("have.attr", "data-hydrated", "true");
}

function field(label: string) {
  return cy.contains("label", label).find("input, select, textarea").first();
}

/** Amanhã às 10:30, no formato do campo datetime-local. */
function tomorrowAtHalfPastTen() {
  const date = new Date(Date.now() + 86_400_000);
  date.setHours(10, 30, 0, 0);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

/** Espera pelo email no Mailpit (o backend envia em segundo plano, a cada 10 s). */
function waitForEmail(to: string, subject: RegExp, attempts = 20): Cypress.Chainable<{ ID: string; Subject: string }> {
  return cy.request(`http://localhost:8025/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`).then((response) => {
    const message = (response.body.messages as Array<{ ID: string; Subject: string }>).find((item) => subject.test(item.Subject));
    if (message) return cy.wrap(message);
    if (attempts <= 1) throw new Error(`Email "${subject}" para ${to} não chegou ao Mailpit.`);
    return cy.wait(2000).then(() => waitForEmail(to, subject, attempts - 1));
  });
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

    cy.contains("Escolha o país de onde envia para ver as agências").should("be.visible");
    field("País de onde envia").select("Portugal");
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
      field("NIF").type("123456789");
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
        field("Data e hora da recolha").type(tomorrowAtHalfPastTen());
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

    field("País de onde envia").select("Estados Unidos");
    cy.contains("label", "Morabeza Envios").should("not.exist");
    cy.contains("label", "Atlantic Bridge Shipping").click();
    cy.contains("button", "Continuar").click();

    cy.contains("Quem envia").parents("div.rounded-2xl").first().within(() => {
      field("Nome").type("Carlos Semedo");
      field("Telefone").should("have.value", "+1 ").clear().type("+1 508 555 0199");
    });
    cy.contains("Quem recebe").parents("div.rounded-2xl").first().within(() => {
      field("Nome").type("Ana Semedo");
      field("Telefone").clear().type("+238 952 11 22");
      field("NIF").type("123456789");
    });
    cy.contains("button", "Continuar").click();

    cy.contains("label", "Criar conta para ver todos os meus envios").click();
    // Email único por execução: a conta fica guardada na base de dados do backend.
    field("Email").type(`carlos.${Date.now()}@example.com`);
    field("Palavra-passe").type("segredo123");
    cy.contains("button", "Enviar pedido à agência").click();

    cy.contains("a", "Ver os meus pedidos").click();
    cy.location("pathname").should("eq", "/cliente");
    cy.contains("Carro, mota ou carrinha · para Ana Semedo, Santiago").should("be.visible");
    cy.screenshot("07-cliente-pedidos", { capture: "fullPage" });

    cy.contains("button", "Cancelar pedido").click();
    cy.get('[data-cy="cancel-request"]').within(() => {
      field("Motivo (opcional)").type("Vou enviar mais tarde");
      cy.contains("button", "Confirmar cancelamento").click();
    });
    cy.contains("Cancelado").should("be.visible");
    cy.contains("button", "Cancelar pedido").should("not.exist");
  });

  it("prefills the sender with the logged-in account and lets it be changed", () => {
    cy.visit("/login");
    cy.get('[data-cy="login-form"]').should("have.attr", "data-hydrated", "true");
    cy.get("#email").type("ana@portus.cv");
    cy.get("#password").type(demoPassword);
    cy.contains("button", "Entrar").click();
    cy.location("pathname", { timeout: 60_000 }).should("eq", "/exportador");

    cy.visit("/enviar");
    waitForHydration("request-wizard");
    cy.contains("label", "Caixa ou encomenda").click();
    field("Quantas caixas").type("2");
    field("Descrição curta").type("Amostras de tecido");
    cy.contains("button", "Continuar").click();
    field("País de onde envia").select("Portugal");
    field("Ilha de destino").select("São Vicente");
    cy.contains("label", "Morabeza Envios").click();
    cy.contains("button", "Continuar").click();

    cy.contains("Preenchido com os dados da sua conta").should("be.visible");
    cy.contains("Quem envia").parents("div.rounded-2xl").first().within(() => {
      field("Nome").should("have.value", "Ana Silva").clear().type("Ana Silva Lda");
      field("Email").should("have.value", "ana@portus.cv");
    });
    cy.contains("Preenchido com os dados da sua conta").should("not.exist");
    cy.contains("Quem envia").parents("div.rounded-2xl").first().within(() => {
      field("Telefone").clear().type("+351 912 345 678");
    });
    cy.contains("Quem recebe").parents("div.rounded-2xl").first().within(() => {
      field("Nome").type("Maria Lopes");
      field("Telefone").clear().type("+238 991 22 33");
      field("NIF").type("123456789");
    });
    cy.contains("button", "Continuar").click();
    cy.contains("Remetente").parent().should("contain.text", "Ana Silva Lda");
    cy.contains("Está a enviar com a sua conta (ana@portus.cv)").should("be.visible");
    cy.contains("Quer criar conta?").should("not.exist");
    cy.screenshot("17-remetente-da-conta", { capture: "fullPage" });
  });

  it("emails the guest a personal link to view and cancel the request", () => {
    const email = `rosa.${Date.now()}@example.pt`;
    cy.contains("label", "Caixa ou encomenda").click();
    field("Quantas caixas").type("1");
    field("Descrição curta").type("Livros e roupa");
    cy.contains("button", "Continuar").click();
    field("País de onde envia").select("Portugal");
    field("Ilha de destino").select("São Vicente");
    cy.contains("label", "Morabeza Envios").click();
    cy.contains("button", "Continuar").click();
    cy.contains("Quem envia").parents("div.rounded-2xl").first().within(() => {
      field("Nome").type("Rosa Tavares");
      field("Telefone").clear().type("+351 912 345 678");
      field("Email").type(email);
    });
    cy.contains("Quem recebe").parents("div.rounded-2xl").first().within(() => {
      field("Nome").type("Maria Lopes");
      field("Telefone").clear().type("+238 991 22 33");
      field("NIF").type("123456789");
    });
    cy.contains("button", "Continuar").click();
    cy.contains("button", "Enviar pedido à agência").click();

    cy.contains(`Enviámos um email para ${email}`).should("be.visible");
    cy.get('[data-cy="request-reference"]').invoke("text").then((reference) => {
      waitForEmail(email, new RegExp(`Pedido ${reference} recebido`)).then((message) => {
        cy.request(`http://localhost:8025/api/v1/message/${message.ID}`).its("body.Text").should("contain", "/pedido/");
      });

      cy.contains("a", "Ver o meu pedido").click();
      cy.location("pathname").should("match", new RegExp(`^/pedido/${reference}\.`));
      cy.contains(String(reference)).should("be.visible");
      cy.contains("button", "Cancelar pedido").click();
      cy.contains("button", "Confirmar cancelamento").click();
      cy.contains("Cancelado").should("be.visible");
      cy.screenshot("08-pedido-cancelado-pelo-link", { capture: "fullPage" });
      waitForEmail(email, new RegExp(`Pedido ${reference} cancelado`));
    });

    cy.visit("/pedido/PED-AAAAAA.falsificado");
    cy.contains("Este link não é válido").should("be.visible");
  });
});
