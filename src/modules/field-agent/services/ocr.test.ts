import { describe, expect, it } from "vitest";
import { parseOcrText } from "@/modules/field-agent/services/ocr";

describe("parseOcrText", () => {
  it("maps labelled Portuguese fields into editable collection suggestions", () => {
    expect(
      parseOcrText(
        [
          "Remetente: Atlantic Exports",
          "Contacto do remetente: +351 912 345 678",
          "Destinatário: Maria Lopes",
          "NIF: 123456789",
          "Telefone: +238 991 112 233",
          "Conteúdo: Roupa",
          "Peso: 2,5 kg",
          "Volume: 0,12 m3",
          "Texto sem etiqueta",
        ].join("\n"),
      ),
    ).toEqual({
      senderName: "Atlantic Exports",
      senderPhone: "+351 912 345 678",
      recipientName: "Maria Lopes",
      recipientDocumentType: "NIF",
      recipientDocumentNumber: "123456789",
      recipientPhone: "+238 991 112 233",
      contentDescription: "Roupa",
      weightKg: "2.5",
      volumeM3: "0.12",
    });
  });

  it("ignores unknown labels and empty OCR values", () => {
    expect(parseOcrText("Código:\nData: 2026-10-28")).toEqual({});
  });
});
