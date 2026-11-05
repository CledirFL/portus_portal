const demoPassword = "PortusDemo!2026-CV";
const apiUrl = "http://localhost:4000/api";

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function field(label: string) {
  return cy
    .contains("label > span", new RegExp(`^${escapeRegExp(label)}$`))
    .parent()
    .find("input, select, textarea")
    .first();
}

function containerNumber(serial: string) {
  const letters: Record<string, number> = {};
  let value = 10;
  for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
    if (value % 11 === 0) value += 1;
    letters[letter] = value;
    value += 1;
  }
  const base = `CVAU${serial}`;
  const sum = [...base].reduce((total, char, index) => total + (/\d/.test(char) ? Number(char) : letters[char]!) * 2 ** index, 0);
  return `${base}${(sum % 11) % 10}`;
}

function logIn(email: string, landing: string) {
  cy.visit("/login", { onBeforeLoad: (browserWindow) => browserWindow.localStorage.clear() });
  cy.get('[data-cy="login-form"]').should("have.attr", "data-hydrated", "true");
  cy.get("#email").type(email);
  cy.get("#password").type(demoPassword);
  cy.contains("button", "Entrar").click();
  cy.location("pathname", { timeout: 60_000 }).should("eq", landing);
}

/** Pela API (B3–B5): encomenda validada, contentor selado, viagem para a Praia com manifesto enviado e partida. */
function departedVoyage(suffix: string, vessel: string) {
  return cy.request("POST", `${apiUrl}/auth/login`, { email: "transitario@portus.cv", password: demoPassword }).then((login) => {
    const headers = { authorization: `Bearer ${login.body.accessToken as string}` };
    const call = (method: string, url: string, body?: object) => cy.request({ method, url: `${apiUrl}${url}`, headers, body });
    return call("POST", "/shipments", {
      category: "encomenda_pequena",
      dispatchCountry: "PT",
      description: "Roupa e alimentos",
      details: {},
      sender: { name: "Rosa Tavares", phone: `+351 914 ${suffix.slice(0, 3)} ${suffix.slice(3)}` },
      recipient: { name: "Maria Lopes", phone: "+238 991 22 33", island: "Santiago", nif: "123456789", documentType: "CNI", documentNumber: `A${suffix}` },
      volumes: [
        { weightKg: 12.5, volumeM3: 0.1, contents: "Roupa" },
        { weightKg: 7, volumeM3: 0.05, contents: "Alimentos" },
      ],
    }).then((created) => {
      const shipmentId = created.body.id as string;
      call("POST", `/shipments/${shipmentId}/validate`);
      return call("GET", `/shipments/${shipmentId}/labels`).then((labelsResponse) => {
        const labels = labelsResponse.body.labels as Array<{ qr: string; volumeCode: string }>;
        return call("POST", "/containers", { number: containerNumber(suffix), sizeType: "22G1" }).then((containerResponse) => {
          const containerId = containerResponse.body.id as string;
          return call("POST", `/containers/${containerId}/bl-masters`, { number: `BLA${suffix}`, loadType: "LCL" }).then((blResponse) => {
            const blMasterId = blResponse.body.blMasters[0].id as string;
            labels.forEach((label) => call("POST", `/containers/${containerId}/volumes`, { code: label.qr, blMasterId }));
            call("POST", `/containers/${containerId}/seal`, { sealNumber: `SA${suffix}` });
            return call("POST", "/voyages", {
              vesselName: vessel,
              departurePort: "PTLIS",
              arrivalPortCode: "CVRAI",
              eta: new Date(Date.now() + 4 * 86_400_000).toISOString(),
            }).then((voyageResponse) => {
              const voyageId = voyageResponse.body.id as string;
              call("POST", `/voyages/${voyageId}/containers`, { containerId });
              return call("POST", `/voyages/${voyageId}/manifests`).then((manifest) => {
                call("POST", `/voyages/${voyageId}/manifests/${manifest.body.id as string}/send`);
                call("POST", `/voyages/${voyageId}/depart`);
                return cy.wrap({ labels, documentNumber: `A${suffix}` });
              });
            });
          });
        });
      });
    });
  });
}

describe("chegada, Alfândega e levantamento", () => {
  it("checks the container, releases the shipment and hands it over with a Gate Pass", () => {
    const suffix = String(Date.now()).slice(-6);
    const vessel = `Chegada ${suffix}`;

    departedVoyage(suffix, vessel).then(({ labels, documentNumber }) => {
      // Terminal: chegada e conferência por QR.
      logIn("terminal@portus.cv", "/cv/chegadas");
      cy.contains("a", vessel, { timeout: 60_000 }).click();
      cy.get('[data-cy="register-arrival"]', { timeout: 60_000 }).click();
      cy.get('[data-cy="confirm-arrival"]').click();
      cy.get('[data-cy="arrival-containers"] a').first().click();
      cy.get('[aria-label="Localização no armazém"]', { timeout: 60_000 }).type("B-04-2");
      labels.forEach((label) => {
        cy.get('[aria-label="QR ou código do volume"]').type(`${label.qr}{enter}`);
        cy.get('[data-cy="check-log"]').should("contain.text", label.volumeCode);
      });
      cy.get('[data-cy="check-log"]').should("contain.text", "Conferido · B-04-2");
      cy.get('[aria-label="QR ou código do volume"]').type("ENC-ZZZZZZ-01{enter}");
      cy.contains("button", "Registar excesso").click();
      field("Descrição").type("Caixa sem lugar no manifesto");
      cy.get('[data-cy="occurrence-form"]').contains("button", "Registar").click();
      cy.get('[data-cy="occurrences"]').should("contain.text", "Excesso").and("contain.text", "ENC-ZZZZZZ-01");
      cy.get('[data-cy="close-container"]').click();
      cy.contains("Desconsolidado", { timeout: 20_000 }).should("be.visible");
      cy.screenshot("b6-conferencia", { capture: "fullPage" });

      // Alfândega: validar o manifesto, canal e libertação.
      logIn("alfandega@portus.cv", "/alfandega");
      cy.contains('[data-cy="customs-voyages"] > div', vessel, { timeout: 60_000 }).within(() => {
        cy.get('[data-cy="validate-manifest"]').click();
        field("Referência da Alfândega").type(`DGA-${suffix}`);
        cy.contains("button", /^Validar$/).click();
      });
      cy.contains('[data-cy="customs-voyages"] > div', vessel).within(() => {
        cy.contains("Validado").should("be.visible");
        cy.contains("a", "Despachar encomendas").click();
      });
      cy.get('[data-cy="clearance"]', { timeout: 60_000 }).within(() => {
        cy.contains("Sugestão (BR 15)").should("contain.text", "Canal verde");
        cy.contains("button", "Canal verde").click();
        cy.get("form").contains("button", "Canal verde").click();
        cy.contains("Canal verde").should("be.visible");
        cy.get('[data-cy="release"]').click();
        field("Direitos (CVE)").clear().type("1000");
        cy.contains("button", "Libertar").click();
        cy.get('[data-cy="pickup-code"]').invoke("text").as("pickupCode");
      });
      cy.screenshot("b6-alfandega", { capture: "fullPage" });

      // Portaria: pagamento, documento, QR e código.
      cy.get<string>("@pickupCode").then((pickupCode) => {
        logIn("portaria@portus.cv", "/portaria");
        cy.get('[aria-label="Código de levantamento, QR ou encomenda"]', { timeout: 60_000 }).type(`${pickupCode}{enter}`);
        cy.get('[data-cy="blockers"]').should("contain.text", "Taxas por pagar: 2000,00 CVE");
        cy.get('[data-cy="payment-form"]').contains("button", "Registar pagamento").click();
        cy.get('[data-cy="ready"]').should("be.visible");

        field("Nº do documento").type(documentNumber);
        labels.forEach((label) => cy.get('[aria-label="QR do volume a entregar"]').type(`${label.qr}{enter}`));
        cy.get('[aria-label="Código de levantamento"]').type(pickupCode);
        cy.contains("button", "Entregar 2 volume(s) e emitir Gate Pass").click();
        cy.get('[data-cy="gate-pass"]', { timeout: 60_000 }).should("contain.text", "GP-").and("contain.text", labels[0]!.volumeCode).and("contain.text", "Pago 2000,00 CVE");
        cy.screenshot("b6-gate-pass", { capture: "fullPage" });
      });
    });
  });
});
