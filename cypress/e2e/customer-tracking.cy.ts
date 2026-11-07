const demoPassword = "PortusDemo!2026-CV";
const apiUrl = "http://localhost:4000/api";

type Headers = { authorization: string };

// ISO 6346 (o mesmo algoritmo de src/domain/validators), para gerar um nº novo em cada execução.
function containerNumber(serial: string) {
  const letters: Record<string, number> = {};
  let value = 10;
  for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
    if (value % 11 === 0) value += 1;
    letters[letter] = value;
    value += 1;
  }
  const base = `TRKU${serial}`;
  const sum = [...base].reduce((total, char, index) => total + (/\d/.test(char) ? Number(char) : letters[char]!) * 2 ** index, 0);
  return `${base}${(sum % 11) % 10}`;
}

function headersFor(email: string) {
  return cy
    .request("POST", `${apiUrl}/auth/login`, { email, password: demoPassword })
    .then((login) => ({ authorization: `Bearer ${login.body.accessToken as string}` }) as Headers);
}

const call = (headers: Headers, method: string, url: string, body?: object) =>
  cy.request({ method, url: `${apiUrl}${url}`, headers, body });

/** Espera pelo email no Mailpit (o backend envia em segundo plano, a cada 10 s). */
function waitForEmail(to: string, subject: RegExp, attempts = 20): Cypress.Chainable<{ ID: string }> {
  return cy.request(`http://localhost:8025/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`).then((response) => {
    const message = (response.body.messages as Array<{ ID: string; Subject: string }>).find((item) => subject.test(item.Subject));
    if (message) return cy.wrap(message);
    if (attempts <= 1) throw new Error(`Email "${subject}" para ${to} não chegou ao Mailpit.`);
    return cy.wait(2000).then(() => waitForEmail(to, subject, attempts - 1));
  });
}

describe("o cliente acompanha a encomenda até ao levantamento", () => {
  it("shows the voyage, then the Cabo Verde agency and the pickup code, on the personal link page", () => {
    const suffix = String(Date.now()).slice(-6);
    const email = `seguir.${suffix}@example.pt`;
    const vessel = `Seguimento ${suffix}`;

    cy.request(`${apiUrl}/agencies?country=PT`).then((agencies) => {
      const agency = (agencies.body as Array<{ id: string; code: string }>).find((item) => item.code === "LIS01")!;
      cy.request("POST", `${apiUrl}/shipment-requests`, {
        dispatchCountry: "PT",
        agencyId: agency.id,
        category: "encomenda_pequena",
        description: "Roupa e alimentos",
        details: { quantity: "1" },
        handover: "entrega_na_agencia",
        sender: { name: "Rosa Tavares", phone: `+351 915 ${suffix.slice(0, 3)} ${suffix.slice(3)}`, email },
        recipient: { name: "Maria Lopes", phone: "+238 991 22 33", island: "Santiago", nif: "123456789" },
      }).then((submitted) => {
        const { id: requestId, accessToken } = submitted.body as { id: string; accessToken: string };

        // Agência: aceita e recebe a carga (nasce a encomenda).
        headersFor("agente@portus.cv").then((agent) => {
          call(agent, "POST", `/agency/shipment-requests/${requestId}/accept`);
          call(agent, "POST", `/agency/shipment-requests/${requestId}/receive`).then((received) => {
            const shipmentId = received.body.shipment.id as string;

            // Transitário: volume, validação, contentor, viagem para a Praia e partida.
            headersFor("transitario@portus.cv").then((forwarder) => {
              call(forwarder, "POST", `/shipments/${shipmentId}/volumes`, { weightKg: 12, volumeM3: 0.1 });
              call(forwarder, "POST", `/shipments/${shipmentId}/validate`);
              call(forwarder, "GET", `/shipments/${shipmentId}/labels`).then((labels) => {
                const label = labels.body.labels[0] as { qr: string; volumeCode: string };
                call(forwarder, "POST", "/containers", { number: containerNumber(suffix), sizeType: "22G1" }).then((container) => {
                  const containerId = container.body.id as string;
                  call(forwarder, "POST", `/containers/${containerId}/bl-masters`, { number: `BLT${suffix}`, loadType: "LCL" }).then((bl) => {
                    call(forwarder, "POST", `/containers/${containerId}/volumes`, { code: label.qr, blMasterId: bl.body.blMasters[0].id });
                    call(forwarder, "POST", `/containers/${containerId}/seal`, { sealNumber: `ST${suffix}` });
                    call(forwarder, "POST", "/voyages", {
                      vesselName: vessel,
                      departurePort: "PTLIS",
                      arrivalPortCode: "CVRAI",
                      eta: new Date(Date.now() + 6 * 86_400_000).toISOString(),
                    }).then((voyage) => {
                      const voyageId = voyage.body.id as string;
                      call(forwarder, "POST", `/voyages/${voyageId}/containers`, { containerId });
                      call(forwarder, "POST", `/voyages/${voyageId}/manifests`).then((manifest) => {
                        const manifestId = manifest.body.id as string;
                        call(forwarder, "POST", `/voyages/${voyageId}/manifests/${manifestId}/send`);
                        call(forwarder, "POST", `/voyages/${voyageId}/depart`);

                        cy.visit(`/pedido/${accessToken}`);
                        cy.get('[data-cy="shipment-timeline"]', { timeout: 60_000 }).should("contain.text", "Em viagem");
                        cy.contains("A carga está a caminho de Cabo Verde.").should("be.visible");
                        cy.contains(`${vessel} → Porto da Praia`).should("be.visible");
                        cy.screenshot("09-seguimento-em-viagem", { capture: "fullPage" });
                        waitForEmail(email, /está a caminho de Cabo Verde/);

                        // Terminal e Alfândega: chegada, conferência e libertação.
                        headersFor("terminal@portus.cv").then((terminal) => {
                          call(terminal, "POST", `/terminal/voyages/${voyageId}/arrive`);
                          call(terminal, "POST", `/terminal/containers/${containerId}/check`, { code: label.qr, location: "T-01-1" });
                        });
                        headersFor("alfandega@portus.cv").then((customs) => {
                          call(customs, "POST", `/customs/manifests/${manifestId}/validate`, { reference: `DGA-${suffix}` });
                          call(customs, "GET", `/customs/voyages/${voyageId}/clearances`).then((clearances) => {
                            const clearanceId = clearances.body[0].id as string;
                            call(customs, "POST", `/customs/clearances/${clearanceId}/channel`, { channel: "green" });
                            call(customs, "POST", `/customs/clearances/${clearanceId}/release`, { dutiesCve: 500 }).then((released) => {
                              // Encomenda pequena: a agência em Cabo Verde levanta-a no porto; ainda não está pronta.
                              cy.reload();
                              cy.get('[data-cy="shipment-timeline"]', { timeout: 60_000 }).should("contain.text", "Liberada pela Alfândega");
                              cy.contains("A agência em Cabo Verde vai levantá-la no porto.").should("be.visible");
                              cy.get('[data-cy="pickup-info"]').should("not.exist");
                              waitForEmail(email, /Carga liberada pela Alfândega/);

                              // Agência em Cabo Verde: levanta no porto e recebe na agência.
                              headersFor("agencia.praia@portus.cv").then((agency) => {
                                call(agency, "POST", "/cv-agency/collect", { shipmentIds: [shipmentId] });
                                call(agency, "POST", "/cv-agency/receive", { code: label.qr });
                              });
                              cy.reload();
                              cy.get('[data-cy="pickup-info"]', { timeout: 60_000 })
                                .should("contain.text", released.body.pickupCode)
                                .and("contain.text", "Morabeza Praia");
                              cy.get('[data-cy="shipment-timeline"]').should("contain.text", "Pronta para levantar na agência");
                              cy.contains("T-01-1").should("not.exist");
                              cy.screenshot("10-seguimento-pronta", { capture: "fullPage" });
                              waitForEmail(email, /Pronta para levantar na agência/);
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
