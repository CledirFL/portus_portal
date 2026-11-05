const demoPassword = "PortusDemo!2026-CV";
const apiUrl = "http://localhost:4000/api";

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Campo pelo texto exato da etiqueta. */
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
  const base = `PTSU${serial}`;
  const sum = [...base].reduce((total, char, index) => total + (/\d/.test(char) ? Number(char) : letters[char]!) * 2 ** index, 0);
  return `${base}${(sum % 11) % 10}`;
}

/** Encomenda validada criada pela API, com etiquetas; devolve o QR assinado de cada volume. */
function validatedShipment(suffix: string) {
  return cy.request("POST", `${apiUrl}/auth/login`, { email: "transitario@portus.cv", password: demoPassword }).then((login) => {
    const headers = { authorization: `Bearer ${login.body.accessToken as string}` };
    return cy
      .request({
        method: "POST",
        url: `${apiUrl}/shipments`,
        headers,
        body: {
          category: "encomenda_pequena",
          dispatchCountry: "PT",
          description: "Roupa e alimentos",
          details: {},
          sender: { name: "Rosa Tavares", phone: `+351 913 ${suffix.slice(0, 3)} ${suffix.slice(3)}` },
          recipient: { name: "Maria Lopes", phone: "+238 991 22 33", island: "São Vicente", nif: "123456789" },
          volumes: [
            { weightKg: 12.5, volumeM3: 0.1, contents: "Roupa" },
            { weightKg: 7, volumeM3: 0.05, contents: "Alimentos" },
          ],
        },
      })
      .then((created) => {
        const id = created.body.id as string;
        cy.request({ method: "POST", url: `${apiUrl}/shipments/${id}/validate`, headers });
        return cy
          .request({ url: `${apiUrl}/shipments/${id}/labels`, headers })
          .then((labels) => (labels.body.labels as Array<{ qr: string; volumeCode: string }>).map((label) => label));
      });
  });
}

describe("consolidação, viagem e manifesto", () => {
  it("consolidates by QR, seals, plans a voyage with the 72-hour alert and sends the manifest", () => {
    const suffix = String(Date.now()).slice(-6);
    const number = containerNumber(suffix);

    validatedShipment(suffix).then((labels) => {
      cy.visit("/login", { onBeforeLoad: (browserWindow) => browserWindow.localStorage.clear() });
      cy.get('[data-cy="login-form"]').should("have.attr", "data-hydrated", "true");
      cy.get("#email").type("transitario@portus.cv");
      cy.get("#password").type(demoPassword);
      cy.contains("button", "Entrar").click();
      cy.location("pathname", { timeout: 60_000 }).should("eq", "/agencia/viagens");

      // Contentor com nº ISO 6346: primeiro com o dígito errado, depois o correto.
      cy.visit("/agencia/contentores");
      cy.contains("button", "Novo contentor", { timeout: 60_000 }).click();
      field("Nº do contentor").type(`${number.slice(0, 10)}${(Number(number[10]) + 1) % 10}`);
      cy.contains(`o último algarismo devia ser ${number[10]}`).should("be.visible");
      field("Nº do contentor").clear().type(number);
      cy.contains("Nº válido.").should("be.visible");
      field("Armador").type("MSC");
      cy.contains("button", "Registar contentor").click();
      cy.contains("h1, h2", number, { timeout: 60_000 }).should("be.visible");

      // BL Master e leitura dos QR (o segundo volume entra sem BL para testar o bloqueio do fecho).
      field("Nº do BL Master").type(`BLM${suffix}`);
      cy.contains("button", "Acrescentar BL Master").click();
      cy.get('[data-cy="bl-masters"]').should("contain.text", `BLM${suffix}`);
      cy.get('[aria-label="QR ou código do volume"]').type(`${labels[0]!.qr}{enter}`);
      cy.get('[data-cy="scan-log"]').should("contain.text", labels[0]!.volumeCode).and("contain.text", `Consolidado no BL BLM${suffix}`);
      cy.get('[aria-label="QR ou código do volume"]').type(`${labels[0]!.qr}{enter}`);
      cy.get('[data-cy="scan-log"]').should("contain.text", "Já estava neste contentor");
      cy.get('[aria-label="BL Master dos volumes lidos"]').select("Sem BL Master (associar depois)");
      cy.get('[aria-label="QR ou código do volume"]').type(`${labels[1]!.volumeCode.toLowerCase()}{enter}`);
      cy.get('[data-cy="container-volumes"]').should("contain.text", labels[1]!.volumeCode);

      field("Nº do selo").type(`SL${suffix}`);
      cy.contains("button", "Selar e fechar").click();
      cy.get('[role="alert"]').should("contain.text", "sem BL Master").and("contain.text", labels[1]!.volumeCode);
      cy.get(`[aria-label="BL Master do volume ${labels[1]!.volumeCode}"]`).select(`BLM${suffix} (LCL)`);
      cy.contains("1 volume(s) sem BL Master").should("not.exist");
      cy.contains("button", "Selar e fechar").click();
      cy.contains(`SL${suffix}`).should("be.visible");
      cy.contains("Selado").should("be.visible");
      cy.screenshot("b5-contentor-selado", { capture: "fullPage" });

      // Viagem com ETA daqui a 48 h: alerta das 72 h.
      cy.visit("/agencia/viagens");
      cy.contains("button", "Nova viagem", { timeout: 60_000 }).click();
      field("Navio").type(`Sorel ${suffix}`);
      field("Nº da viagem").type("045S");
      const eta = new Date(Date.now() + 48 * 3_600_000);
      const local = new Date(eta.getTime() - eta.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
      field("Chegada prevista (ETA)").type(local);
      field("Porto de chegada").select("Porto Grande (Mindelo) — São Vicente");
      cy.contains("button", "Criar viagem").click();
      cy.contains("h1, h2", `Sorel ${suffix}`, { timeout: 60_000 }).should("be.visible");
      cy.get('[data-cy="manifest-alert"]').should("be.visible");

      cy.contains('[data-cy="assign-container"] option', `${number} · selado`).then((option) => {
        cy.get('[data-cy="assign-container"] select').select(String(option.val()));
      });
      cy.contains("button", "Associar").click();
      cy.get('[data-cy="voyage-containers"]').should("contain.text", number);

      cy.get('[data-cy="generate-manifest"]').click();
      cy.get('[data-cy="manifests"]').should("contain.text", "Versão 1").and("contain.text", "2 vol.");

      // Exportação: o ficheiro tem os volumes.
      cy.request("POST", `${apiUrl}/auth/login`, { email: "transitario@portus.cv", password: demoPassword }).then((login) => {
        cy.location("pathname").then((path) => {
          const voyageId = path.split("/").pop()!;
          cy.request({ url: `${apiUrl}/voyages/${voyageId}`, headers: { authorization: `Bearer ${login.body.accessToken as string}` } }).then((voyage) => {
            const manifestId = voyage.body.manifests[0].id as string;
            cy.request({
              url: `${apiUrl}/voyages/${voyageId}/manifests/${manifestId}/export?format=csv`,
              headers: { authorization: `Bearer ${login.body.accessToken as string}` },
            })
              .its("body")
              .should("contain", labels[0]!.volumeCode)
              .and("contain", labels[1]!.volumeCode);
          });
        });
      });
      cy.get('[data-cy="manifests"] [data-cy="export-pdf"]').first().should("be.enabled");

      cy.get('[data-cy="send-manifest"]').click();
      cy.contains("Manifesto enviado").should("be.visible");
      cy.get('[data-cy="manifest-alert"]').should("not.exist");
      cy.screenshot("b5-viagem-manifesto-enviado", { capture: "fullPage" });

      cy.get('[data-cy="depart"]').click();
      cy.get('[data-cy="confirm-depart"]').click();
      cy.contains("Em viagem").should("be.visible");
      cy.get('[data-cy="voyage-containers"]').should("contain.text", "Embarcado");
    });
  });
});
