const demoPassword = "PortusDemo!2026-CV";
const apiUrl = "http://localhost:4000/api";

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Campo pelo texto exato da etiqueta (evita apanhar opções, ex.: "Estado" dentro de "Estados Unidos"). */
function field(label: string) {
  return cy
    .contains("label > span", new RegExp(`^${escapeRegExp(label)}$`))
    .parent()
    .find("input, select, textarea")
    .first();
}

function card(title: string) {
  return cy.contains("h3", title).parents("div.rounded-2xl").first();
}

/** Telefone diferente em cada execução para não disparar o alerta de duplicados do mesmo dia. */
function uniquePhone() {
  return `+351 91${String(Date.now()).slice(-7)}`;
}

function logInAsAgent() {
  cy.visit("/login", { onBeforeLoad: (browserWindow) => browserWindow.localStorage.clear() });
  cy.get('[data-cy="login-form"]').should("have.attr", "data-hydrated", "true");
  cy.get("#email").type("agente@portus.cv");
  cy.get("#password").type(demoPassword);
  cy.contains("button", "Entrar").click();
  cy.location("pathname").should("eq", "/agent/collections");
}

function fillParties(senderPhone: string) {
  card("Remetente").within(() => {
    field("Nome").type("Rosa Tavares");
    field("Telefone").type(senderPhone);
  });
  card("Destinatário").within(() => {
    field("Nome").type("Maria Lopes");
    field("Telefone").clear().type("+238 991 22 33");
    field("Ilha").select("São Vicente");
    field("NIF (opcional)").type("123456789");
  });
}

function fillSmallParcel(senderPhone: string) {
  cy.visit("/agencia/encomendas/nova");
  field("País de onde envia").should("have.value", "PT");
  field("Conteúdo declarado").type("Roupa e alimentos secos");
  fillParties(senderPhone);

  cy.contains("p", "Volume 1").parents("div.rounded-xl").first().within(() => {
    field("Peso (kg)").type("12,5");
    field("C (cm)").type("60");
    field("L (cm)").type("40");
    field("A (cm)").type("40");
  });
  cy.contains("button", "Acrescentar volume").click();
  cy.contains("p", "Volume 2").parents("div.rounded-xl").first().within(() => {
    field("Peso (kg)").type("7");
    field("ou volume (m³)").type("0,08");
    cy.contains("label", "Caixa fechada e selada").find("input").uncheck();
  });
}

describe("encomendas da agência", () => {
  beforeEach(() => {
    logInAsAgent();
  });

  it("registers, validates and prints signed labels", () => {
    fillSmallParcel(uniquePhone());
    cy.contains("button", "Guardar rascunho").click();

    // A primeira visita a esta rota obriga o servidor de desenvolvimento a compilá-la.
    cy.location("pathname", { timeout: 30_000 }).should("match", /^\/agencia\/encomendas\/[0-9a-f-]{36}$/);
    cy.contains("h2", /^ENC-[A-Z2-9]{6}$/).should("be.visible");
    cy.contains("Rascunho").should("be.visible");
    cy.contains("Volumes (2)").should("be.visible");
    cy.contains("19.5 kg · 0.176 m³").should("be.visible");

    cy.contains("button", "Validar").click();
    cy.contains("Validada").should("be.visible");
    cy.get("tbody").contains("Recolhido").should("be.visible");

    cy.contains("a", "Imprimir etiquetas").click();
    cy.get('[data-cy="volume-label"]', { timeout: 30_000 }).should("have.length", 2);
    cy.contains("Volume 2 de 2").should("be.visible");
    cy.screenshot("b3-etiquetas", { capture: "fullPage" });

    cy.get("[data-qr]")
      .first()
      .invoke("attr", "data-qr")
      .then((payload) => {
        expect(payload).to.match(/^PORTUS\|1\|ENC-[A-Z2-9]{6}-01\|LIS01\|123456789\|S\|/);
        cy.get("[data-qr] svg").should("have.length", 2);

        // A etiqueta impressa é aceite pela verificação da API.
        cy.request("POST", `${apiUrl}/auth/login`, { email: "agente@portus.cv", password: demoPassword }).then((login) => {
          cy.request({
            method: "POST",
            url: `${apiUrl}/labels/verify`,
            headers: { authorization: `Bearer ${login.body.accessToken as string}` },
            body: { payload },
          })
            .its("body")
            .should("deep.include", { valid: true });
        });
      });
  });

  it("lists missing vehicle fields and validates once they are filled", () => {
    cy.visit("/agencia/encomendas/nova");
    field("Tipo de carga").select("Veículos");
    field("Conteúdo declarado").type("Carrinha usada");
    field("VIN").type(`JTEEB12J30${String(Date.now()).slice(-7)}`);
    field("Marca").type("Toyota");
    fillParties(uniquePhone());
    cy.contains("p", "Volume 1").parents("div.rounded-xl").first().within(() => {
      field("Peso (kg)").type("1800");
      field("ou volume (m³)").type("15");
    });
    cy.contains("button", "Guardar rascunho").click();

    cy.contains("button", "Validar").click();
    cy.contains("Faltam dados obrigatórios").should("be.visible");
    cy.contains("li", "Modelo:").should("be.visible");
    cy.contains("li", "Combustível:").should("be.visible");

    cy.contains("a", "Editar dados").click();
    cy.contains("h2", /^Editar ENC-/, { timeout: 30_000 }).should("be.visible");
    field("Modelo").type("Hilux");
    field("Ano").type("2016");
    field("Cilindrada (cm³)").type("2400");
    field("Combustível").select("Gasóleo");
    field("Estado").select("Usado");
    field("Valor de compra (€)").type("15000");
    cy.contains("button", "Guardar alterações").click();

    cy.contains("dd", "Gasóleo").should("be.visible");
    cy.contains("button", "Validar").click();
    cy.contains("Validada").should("be.visible");
  });

  it("warns about a possible duplicate and lets the agent decide", () => {
    const phone = uniquePhone();
    fillSmallParcel(phone);
    cy.contains("button", "Guardar rascunho").click();
    cy.contains("h2", /^ENC-/).should("be.visible");

    fillSmallParcel(phone);
    cy.contains("button", "Guardar rascunho").click();
    cy.contains("Possível encomenda duplicada").should("be.visible");
    cy.contains("li", "mesmo remetente, destinatário e peso").should("be.visible");
    cy.screenshot("b3-duplicado");
    cy.contains("button", "Registar mesmo assim").click();
    cy.contains("h2", /^ENC-/).should("be.visible");
  });

  it("creates the shipment when a customer request is received", () => {
    cy.request(`${apiUrl}/agencies?country=PT`).then((agencies) => {
      const agency = (agencies.body as Array<{ id: string; code: string }>).find((item) => item.code === "LIS01")!;
      cy.request("POST", `${apiUrl}/shipment-requests`, {
        dispatchCountry: "PT",
        agencyId: agency.id,
        category: "encomenda_pequena",
        description: "Caixas de roupa",
        details: { quantity: "2" },
        handover: "entrega_na_agencia",
        sender: { name: "Cliente E2E", phone: uniquePhone() },
        recipient: { name: "Nha Djon", phone: "+238 991 22 33", island: "Santiago" },
      }).then((created) => {
        const reference = created.body.reference as string;

        cy.visit("/agencia/pedidos");
        cy.contains(reference).click();
        cy.contains("button", "Aceitar").click();
        cy.contains("button", /^Em curso/).click();
        cy.contains(reference).click();
        cy.contains("button", "Carga recebida").click();

        cy.contains("button", /^Fechados/).click();
        cy.contains(reference).click();
        cy.contains("a", "Abrir para pesar e etiquetar").click();
        cy.contains(`Criada a partir do pedido ${reference}`, { timeout: 30_000 }).should("be.visible");
        cy.contains("Ainda sem volumes").should("be.visible");
      });
    });
  });
});
