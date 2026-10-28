import { createWorker } from "tesseract.js";
import type { CollectionFieldSuggestions } from "@/modules/field-agent/types/collection";

declare global {
  interface Window {
    __PORTUS_CYPRESS_OCR__?: {
      recognize: (image: Blob) => Promise<string>;
    };
  }
}

type MappedField = Exclude<keyof CollectionFieldSuggestions, "recipientDocumentType">;

const fieldLabels: Record<string, MappedField> = {
  remetente: "senderName",
  sender: "senderName",
  "contacto do remetente": "senderPhone",
  "telefone do remetente": "senderPhone",
  "sender phone": "senderPhone",
  destinatario: "recipientName",
  "nome do destinatario": "recipientName",
  recipient: "recipientName",
  "recipient name": "recipientName",
  nif: "recipientDocumentNumber",
  documento: "recipientDocumentNumber",
  "numero do documento": "recipientDocumentNumber",
  telefone: "recipientPhone",
  telemovel: "recipientPhone",
  contacto: "recipientPhone",
  "telefone do destinatario": "recipientPhone",
  "recipient phone": "recipientPhone",
  conteudo: "contentDescription",
  descricao: "contentDescription",
  "content description": "contentDescription",
  peso: "weightKg",
  "peso kg": "weightKg",
  weight: "weightKg",
  volume: "volumeM3",
  "volume m3": "volumeM3",
  comprimento: "lengthCm",
  largura: "widthCm",
  altura: "heightCm",
};

function normalizeLabel(label: string) {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeNumber(value: string) {
  const number = value.match(/[\d]+(?:[.,]\d+)?/)?.[0];
  return number?.replace(",", ".") ?? value.trim();
}

export function parseOcrText(text: string): CollectionFieldSuggestions {
  const suggestions: CollectionFieldSuggestions = {};

  for (const line of text.split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator < 1) {
      continue;
    }

    const label = normalizeLabel(line.slice(0, separator));
    const field = fieldLabels[label];
    const value = line.slice(separator + 1).trim();

    if (!field || !value) {
      continue;
    }

    if (field === "recipientDocumentNumber") {
      suggestions.recipientDocumentType = "NIF";
    }

    suggestions[field] =
      field === "weightKg" || field === "volumeM3" || field === "lengthCm" || field === "widthCm" || field === "heightCm"
        ? normalizeNumber(value)
        : value;
  }

  return suggestions;
}

export async function recognizeCollectionPhoto(photo: Blob) {
  // Cypress injects a predictable OCR result only into the development server.
  if (process.env.NODE_ENV === "development" && window.__PORTUS_CYPRESS_OCR__) {
    return window.__PORTUS_CYPRESS_OCR__.recognize(photo);
  }

  const worker = await createWorker("por");

  try {
    const result = await worker.recognize(photo);
    return result.data.text;
  } finally {
    await worker.terminate();
  }
}
