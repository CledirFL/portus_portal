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

// ISO 6346, para um nº de contentor novo em cada execução.
function containerNumber(serial: string) {
  const letters: Record<string, number> = {};
  let value = 10;
  for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
    if (value % 11 === 0) value += 1;
    letters[letter] = value;
    value += 1;
  }
  const base = `VCLU${serial}`;
  const sum = [...base].reduce((total, char, index) => total + (/\d/.test(char) ? Number(char) : letters[char]!) * 2 ** index, 0);
  return `${base}${(sum % 11) % 10}`;
}

/** VIN válido (dígito de controlo na 9.ª posição) a partir de um número de série. */
function vin(serial: string) {
  const values: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9 };
  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
  const raw = `JTDBR32E0${serial.padStart(8, "0").slice(-8)}`;
  const sum = [...raw].reduce((total, char, index) => total + (/\d/.test(char) ? Number(char) : values[char]!) * weights[index]!, 0);
  const check = sum % 11 === 10 ? "X" : String(sum % 11);
  return `${raw.slice(0, 8)}${check}${raw.slice(9)}`;
}

function headersFor(email: string) {
  return cy.request("POST", `${apiUrl}/auth/login`, { email, password: demoPassword }).then((login) => ({ authorization: `Bearer ${login.body.accessToken as string}` }) as Headers);
}
const call = (headers: Headers, method: string, url: string, body?: object) => cy.request({ method, url: `${apiUrl}${url}`, headers, body });

function logIn(email: string, landing: string) {
  cy.visit("/login", { onBeforeLoad: (browserWindow) => browserWindow.localStorage.clear() });
  cy.get('[data-cy="login-form"]').should("have.attr", "data-hydrated", "true");
  cy.get("#email").type(email);
  cy.get("#password").type(demoPassword, { log: false });
  cy.contains("button", "Entrar").click();
  cy.location("pathname", { timeout: 60_000 }).should("eq", landing);
}

const pdf = (name: string) => ({ contents: Cypress.Buffer.from(`%PDF-1.4\n% ${name}\ntrailer << >>\n%%EOF\n`), fileName: name, mimeType: "application/pdf" });

describe("desalfandegamento da viatura pelo dono", () => {
  it("goes from the owner's documents to customs, the DGTR inspection and the plate", () => {
    const suffix = String(Date.now()).slice(-6);
    const description = `Carro E2E ${suffix}`;

    // Pela API: viatura da Rosa (cliente@portus.cv), paga, embarcada, chegada e conferida; manifesto validado.
    headersFor("transitario@portus.cv").then((forwarder) => {
      call(forwarder, "POST", "/shipments", {
        category: "veiculo",
        dispatchCountry: "PT",
        description,
        details: { vin: vin(suffix), make: "Toyota", model: `Yaris ${suffix}`, year: "2019", engineCc: "1300", fuel: "Gasolina", condition: "Usado", regime: "particular", value: "7000" },
        sender: { name: "Rosa Tavares", phone: `+351 917 ${suffix.slice(0, 3)} ${suffix.slice(3)}`, email: "cliente@portus.cv" },
        recipient: { name: "Maria Lopes", phone: "+238 991 22 33", island: "Santiago", nif: "123456789", documentType: "CNI", documentNumber: `V${suffix}` },
        volumes: [{ weightKg: 1100 + Number(suffix.slice(-2)), volumeM3: 12 }],
      }).then((created) => {
        const shipmentId = created.body.id as string;
        call(forwarder, "POST", `/shipments/${shipmentId}/validate`, { confirmDuplicates: true });
        call(forwarder, "POST", `/shipments/${shipmentId}/transport-payments`, { amount: 950, currency: "EUR", method: "transfer" });
        call(forwarder, "GET", `/shipments/${shipmentId}/labels`).then((labels) => {
          const label = labels.body.labels[0] as { qr: string };
          call(forwarder, "POST", "/containers", { number: containerNumber(suffix), sizeType: "22G1" }).then((container) => {
            const containerId = container.body.id as string;
            call(forwarder, "POST", `/containers/${containerId}/bl-masters`, { number: `BLV${suffix}`, loadType: "FCL" }).then((bl) => {
              call(forwarder, "POST", `/containers/${containerId}/volumes`, { code: label.qr, blMasterId: bl.body.blMasters[0].id });
              call(forwarder, "POST", `/containers/${containerId}/seal`, { sealNumber: `SV${suffix}` });
              call(forwarder, "POST", "/voyages", { vesselName: `Viatura ${suffix}`, departurePort: "PTLIS", arrivalPortCode: "CVRAI", eta: new Date(Date.now() + 4 * 86_400_000).toISOString() }).then(
                (voyage) => {
                  const voyageId = voyage.body.id as string;
                  call(forwarder, "POST", `/voyages/${voyageId}/containers`, { containerId });
                  call(forwarder, "POST", `/voyages/${voyageId}/manifests`).then((manifest) => {
                    call(forwarder, "POST", `/voyages/${voyageId}/manifests/${manifest.body.id as string}/send`);
                    call(forwarder, "POST", `/voyages/${voyageId}/depart`);
                    headersFor("terminal@portus.cv").then((terminal) => {
                      call(terminal, "POST", `/terminal/voyages/${voyageId}/arrive`);
                      call(terminal, "POST", `/terminal/containers/${containerId}/check`, { code: label.qr, location: "V-01-1" });
                    });
                    headersFor("alfandega@portus.cv").then((customs) => {
                      call(customs, "POST", `/customs/manifests/${manifest.body.id as string}/validate`, { reference: `DGA-${suffix}` });

                      // Dono: abre o processo, envia os documentos e submete.
                      logIn("cliente@portus.cv", "/cliente");
                      cy.get("nav").contains("a", "As minhas viaturas").click();
                      cy.contains('[data-cy="my-vehicles"] li', `Yaris ${suffix}`, { timeout: 60_000 }).contains("button", "Desalfandegar").click();
                      cy.contains("button", "Começar o desalfandegamento", { timeout: 60_000 }).click();
                      cy.get('[data-cy="required-documents"]', { timeout: 60_000 }).should("contain.text", "Fatura de compra");
                      cy.get('[data-cy="submit-clearance"]').click();
                      cy.get('[data-cy="clearance-error"]').should("contain.text", "Faltam documentos");
                      cy.get('[data-cy="upload-invoice"]').selectFile(pdf("fatura.pdf"), { force: true });
                      cy.get('[data-cy="vehicle-documents"]').should("contain.text", "fatura.pdf");
                      cy.get('[data-cy="upload-homologation"]').selectFile(pdf("coc.pdf"), { force: true });
                      cy.get('[data-cy="vehicle-documents"]').should("contain.text", "coc.pdf");
                      cy.get('[data-cy="upload-foreign_registration"]').selectFile(pdf("registo.pdf"), { force: true });
                      cy.get('[data-cy="upload-registration_cancellation"]').selectFile(pdf("cancelamento.pdf"), { force: true });
                      cy.get('[data-cy="upload-owner_id"]').selectFile(pdf("identificacao.pdf"), { force: true });
                      cy.get('[data-cy="upload-transport_proof"]').selectFile(pdf("bl.pdf"), { force: true });
                      cy.get('[data-cy="upload-insurance"]').selectFile(pdf("seguro.pdf"), { force: true });
                      cy.get('[data-cy="vehicle-documents"] li').should("have.length", 7);
                      cy.get('[data-cy="submit-clearance"]').click();
                      cy.contains("Na Alfândega").should("be.visible");
                      cy.screenshot("b11-dono-submetido", { capture: "fullPage" });

                      // Alfândega: aceita os documentos e liquida os direitos.
                      logIn("alfandega@portus.cv", "/alfandega");
                      cy.get("nav").contains("a", "Viaturas").click();
                      cy.contains('[data-cy="vehicle-queue"] a', `Yaris ${suffix}`, { timeout: 60_000 }).click();
                      cy.get('[data-cy="vehicle-documents"] li', { timeout: 60_000 }).should("have.length", 7);
                      for (let index = 0; index < 7; index += 1) {
                        cy.get('[data-cy="vehicle-documents"]').contains("button", "Aceitar").first().click();
                        cy.get('[data-cy="vehicle-documents"]').find("button:contains('Aceitar')").should("have.length", 6 - index);
                      }
                      cy.get('[data-cy="assess-form"]').contains("button", "Liquidar os direitos").click();
                      cy.contains("Direitos liquidados · inspeção").should("be.visible");
                      cy.get('[data-cy="vehicle-duties"]').should("contain.text", "A pagar").and("contain.text", "8703");

                      // DGTR: inspeção aprovada; Alfândega regista o pagamento (API); DGTR emite a matrícula.
                      logIn("dgtr@portus.cv", "/dgtr");
                      cy.contains('[data-cy="vehicle-queue"] a', `Yaris ${suffix}`, { timeout: 60_000 }).click();
                      cy.get('[data-cy="inspection-form"]', { timeout: 60_000 }).contains("button", "Registar inspeção").click();
                      cy.contains("Inspeção aprovada").should("be.visible");
                      cy.location("pathname").then((pathname) => {
                        const clearanceId = pathname.split("/").pop()!;
                        call(customs, "POST", `/vehicle-clearances/${clearanceId}/payment`, { method: "transfer", reference: `DUC-${suffix}` });
                      });
                      cy.reload();
                      const plate = `ST-${suffix.slice(0, 2)}-${String.fromCharCode(65 + (Number(suffix[2]) % 26))}${String.fromCharCode(65 + (Number(suffix[3]) % 26))}`;
                      cy.get('[data-cy="registration-form"]', { timeout: 60_000 }).within(() => {
                        field("Matrícula").type(plate);
                        cy.contains("button", "Emitir matrícula").click();
                      });
                      cy.get('[data-cy="vehicle-outcome"]').should("contain.text", plate).and("contain.text", "LEV-");
                      cy.screenshot("b11-dgtr-matricula", { capture: "fullPage" });

                      // Dono: vê a matrícula e o código para levantar no porto.
                      logIn("cliente@portus.cv", "/cliente");
                      cy.visit(`/cliente/viaturas/${shipmentId}`);
                      cy.get('[data-cy="vehicle-ready"]', { timeout: 60_000 }).should("contain.text", plate).and("contain.text", "LEV-");
                    });
                  });
                },
              );
            });
          });
        });
      });
    });
  });
});
