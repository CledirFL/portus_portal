const demoPassword = "PortusDemo!2026-CV";
const apiUrl = "http://localhost:4000/api";

type Headers = { authorization: string };

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function field(label: string) {
  return cy
    .contains("label > span", new RegExp(`^${escapeRegExp(label)}$`))
    .parent()
    .find("input, select, textarea")
    .first();
}

// ISO 6346 (o mesmo algoritmo de src/domain/validators), para gerar um nº novo em cada execução.
function containerNumber(serial: string) {
  const letters: Record<string, number> = {};
  let value = 10;
  for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
    if (value % 11 === 0) value += 1;
    letters[letter] = value;
    value += 1;
  }
  const base = `AGCU${serial}`;
  const sum = [...base].reduce((total, char, index) => total + (/\d/.test(char) ? Number(char) : letters[char]!) * 2 ** index, 0);
  return `${base}${(sum % 11) % 10}`;
}

function headersFor(email: string) {
  return cy
    .request("POST", `${apiUrl}/auth/login`, { email, password: demoPassword })
    .then((login) => ({ authorization: `Bearer ${login.body.accessToken as string}` }) as Headers);
}

const call = (headers: Headers, method: string, url: string, body?: object) => cy.request({ method, url: `${apiUrl}${url}`, headers, body });

function logIn(email: string, landing: string) {
  cy.visit("/login", { onBeforeLoad: (browserWindow) => browserWindow.localStorage.clear() });
  cy.get('[data-cy="login-form"]').should("have.attr", "data-hydrated", "true");
  cy.get("#email").type(email);
  cy.get("#password").type(demoPassword);
  cy.contains("button", "Entrar").click();
  cy.location("pathname", { timeout: 60_000 }).should("eq", landing);
}

/** Espera pelo email no Mailpit (o backend envia em segundo plano, a cada 10 s). */
function waitForEmail(to: string, subject: RegExp, attempts = 20): Cypress.Chainable<{ ID: string }> {
  return cy.request(`http://localhost:8025/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`).then((response) => {
    const message = (response.body.messages as Array<{ ID: string; Subject: string }>).find((item) => subject.test(item.Subject));
    if (message) return cy.wrap(message);
    if (attempts <= 1) throw new Error(`Email "${subject}" para ${to} não chegou ao Mailpit.`);
    return cy.wait(2000).then(() => waitForEmail(to, subject, attempts - 1));
  });
}

interface Released {
  shipmentId: string;
  shipmentCode: string;
  pickupCode: string;
  label: { qr: string; volumeCode: string };
}

/** Pela API: encomenda pequena para Santiago (Lisboa → Morabeza Praia), viagem, conferência e libertação na Alfândega. */
function releasedParcel(suffix: string, senderEmail: string) {
  return headersFor("transitario@portus.cv").then((forwarder) =>
    call(forwarder, "POST", "/shipments", {
      category: "encomenda_pequena",
      dispatchCountry: "PT",
      description: "Roupa e alimentos",
      details: {},
      sender: { name: "Rosa Tavares", phone: `+351 916 ${suffix.slice(0, 3)} ${suffix.slice(3)}`, email: senderEmail },
      recipient: { name: "Nha Lena", phone: "+238 991 44 55", island: "Santiago", nif: "222333444", documentType: "CNI", documentNumber: `C${suffix}` },
      volumes: [{ weightKg: 9, volumeM3: 0.08, contents: "Roupa" }],
    }).then((created) => {
      const shipmentId = created.body.id as string;
      return call(forwarder, "POST", `/shipments/${shipmentId}/validate`).then((validated) => {
        const { code: shipmentCode, pickupCode, destinationAgency } = validated.body as { code: string; pickupCode: string; destinationAgency: { code: string } };
        expect(destinationAgency.code).to.eq("PRA01");
        return call(forwarder, "GET", `/shipments/${shipmentId}/labels`).then((labels) => {
          const label = labels.body.labels[0] as { qr: string; volumeCode: string };
          return call(forwarder, "POST", "/containers", { number: containerNumber(suffix), sizeType: "22G1" }).then((container) => {
            const containerId = container.body.id as string;
            return call(forwarder, "POST", `/containers/${containerId}/bl-masters`, { number: `BLG${suffix}`, loadType: "LCL" }).then((bl) => {
              call(forwarder, "POST", `/containers/${containerId}/volumes`, { code: label.qr, blMasterId: bl.body.blMasters[0].id });
              call(forwarder, "POST", `/containers/${containerId}/seal`, { sealNumber: `SG${suffix}` });
              return call(forwarder, "POST", "/voyages", {
                vesselName: `Agência ${suffix}`,
                departurePort: "PTLIS",
                arrivalPortCode: "CVRAI",
                eta: new Date(Date.now() + 5 * 86_400_000).toISOString(),
              }).then((voyage) => {
                const voyageId = voyage.body.id as string;
                call(forwarder, "POST", `/voyages/${voyageId}/containers`, { containerId });
                return call(forwarder, "POST", `/voyages/${voyageId}/manifests`).then((manifest) => {
                  const manifestId = manifest.body.id as string;
                  call(forwarder, "POST", `/voyages/${voyageId}/manifests/${manifestId}/send`);
                  call(forwarder, "POST", `/voyages/${voyageId}/depart`);
                  headersFor("terminal@portus.cv").then((terminal) => {
                    call(terminal, "POST", `/terminal/voyages/${voyageId}/arrive`);
                    call(terminal, "POST", `/terminal/containers/${containerId}/check`, { code: label.qr, location: "T-02-1" });
                  });
                  return headersFor("alfandega@portus.cv").then((customs) => {
                    call(customs, "POST", `/customs/manifests/${manifestId}/validate`, { reference: `DGA-${suffix}` });
                    return call(customs, "GET", `/customs/voyages/${voyageId}/clearances`).then((clearances) => {
                      const clearanceId = clearances.body[0].id as string;
                      call(customs, "POST", `/customs/clearances/${clearanceId}/channel`, { channel: "green" });
                      call(customs, "POST", `/customs/clearances/${clearanceId}/release`, { dutiesCve: 300 });
                      return cy.wrap<Released>({ shipmentId, shipmentCode, pickupCode, label });
                    });
                  });
                });
              });
            });
          });
        });
      });
    }),
  );
}

describe("agência em Cabo Verde", () => {
  it("collects a small parcel at the port, receives it and hands it over to whoever brings the receipt", () => {
    const suffix = String(Date.now()).slice(-6);
    const senderEmail = `remetente.${suffix}@example.pt`;

    releasedParcel(suffix, senderEmail).then(({ shipmentId, shipmentCode, pickupCode, label }) => {
      // Origem: o comprovativo impresso e enviado ao remetente leva o código de levantamento.
      logIn("transitario@portus.cv", "/agencia/viagens");
      cy.visit(`/agencia/encomendas/${shipmentId}/comprovativo`);
      cy.get('[data-cy="receipt"]', { timeout: 60_000 }).should("contain.text", pickupCode).and("contain.text", "Morabeza Praia");
      waitForEmail(senderEmail, /^Comprovativo de envio/);

      // Agência: liberadas → levantar no porto.
      logIn("agencia.praia@portus.cv", "/agencia-cv");
      cy.get('[aria-label="Procurar encomendas"]').type(`${shipmentCode}{enter}`);
      cy.get('[data-cy="agency-shipments"]', { timeout: 60_000 }).should("contain.text", shipmentCode).and("contain.text", "Nha Lena");
      cy.get(`[aria-label="Marcar ${shipmentCode}"]`).check();
      cy.get('[data-cy="agency-collect"]').should("contain.text", "Levantar no porto (1)").click();
      cy.get('[data-cy="agency-notice"]').should("contain.text", "1 encomenda(s), 1 volume(s) levantados no porto");

      // A caminho → receber na agência pelo QR.
      cy.contains('[role="tab"]', "A caminho").click();
      cy.get('[data-cy="agency-shipments"]').should("contain.text", shipmentCode);
      cy.get('[aria-label="QR ou código do volume"]').type(`${label.qr}{enter}`);
      cy.get('[data-cy="agency-receive-result"]').should("contain.text", `A encomenda ${shipmentCode} está completa e pronta a entregar`);
      waitForEmail(senderEmail, /^Pronta para levantar na agência/);

      // Na agência → entregar: taxas, depois terceiro com o código do comprovativo e o documento do destinatário.
      cy.contains('[role="tab"]', "Na agência").click();
      cy.get('[data-cy="agency-shipments"]').contains("tr", shipmentCode).contains("button", "Entregar").click();
      cy.location("pathname").should("eq", "/agencia-cv/entregar");
      cy.get('[data-cy="agency-recipient"]', { timeout: 60_000 }).should("contain.text", "Nha Lena");
      cy.get('[data-cy="agency-blockers"]').should("contain.text", "Taxas por pagar");
      cy.get('[data-cy="agency-payment"]').contains("button", "Registar pagamento").click();
      cy.get('[data-cy="agency-ready"]').should("be.visible");

      cy.contains('[role="tab"]', "Outra pessoa, com o comprovativo").click();
      field("Código do comprovativo").type("LEV-ZZZZZZ");
      field("Documento do destinatário").type("222333444");
      field("Nome de quem levanta").type("Djon Tavares");
      field("Nº do documento").type("D9998887");
      cy.get('[data-cy="agency-deliver"]').contains("button", "Entregar 1 volume(s)").click();
      cy.get('[data-cy="agency-deliver"] [role="alert"]').should("contain.text", "O código não corresponde ao comprovativo");
      field("Código do comprovativo").clear().type(pickupCode);
      cy.get('[data-cy="agency-deliver"]').contains("button", "Entregar 1 volume(s)").click();

      cy.get('[data-cy="delivery-note"]', { timeout: 60_000 })
        .should("contain.text", "ENT-")
        .and("contain.text", "Djon Tavares (com o comprovativo do remetente)")
        .and("contain.text", label.volumeCode)
        .and("contain.text", "Morabeza Praia");
      cy.screenshot("b9-comprovativo-entrega", { capture: "fullPage" });
      waitForEmail(senderEmail, /^Carga entregue/);

      cy.visit("/agencia-cv");
      cy.contains('[role="tab"]', "Entregues").click();
      cy.get('[aria-label="Procurar encomendas"]').type(`${shipmentCode}{enter}`);
      cy.get('[data-cy="agency-shipments"]', { timeout: 60_000 }).should("contain.text", shipmentCode).and("contain.text", "Entregue");
    });
  });
});
