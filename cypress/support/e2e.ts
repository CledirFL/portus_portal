const recognizedLabel = [
  "Remetente: Atlantic Exports",
  "Contacto do remetente: +351 912 345 678",
  "Destinatário: Maria Lopes OCR",
  "NIF: 123456789",
  "Telefone: +238 991 112 233",
  "Conteúdo: Roupa",
  "Peso: 2,5 kg",
  "Volume: 0,12 m3",
].join("\n");

Cypress.on("window:before:load", (browserWindow) => {
  browserWindow.__PORTUS_CYPRESS_OCR__ = {
    recognize: async (image) => {
      if (!image.type.startsWith("image/") || image.size === 0) {
        throw new Error("A imagem de teste não é válida.");
      }

      return recognizedLabel;
    },
  };
});

declare global {
  interface Window {
    __PORTUS_CYPRESS_OCR__?: {
      recognize: (image: Blob) => Promise<string>;
    };
  }
}

export {};
