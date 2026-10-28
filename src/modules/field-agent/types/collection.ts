export type CollectionDocumentType = "NIF" | "BI" | "Passaporte";

export interface CollectionFields {
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientDocumentType: CollectionDocumentType;
  recipientDocumentNumber: string;
  recipientPhone: string;
  contentDescription: string;
  weightKg: string;
  volumeM3: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
}

export type CollectionFieldSuggestions = Partial<CollectionFields>;

export interface FieldCollection {
  id: string;
  agentId: string;
  agentName: string;
  createdAt: string;
  status: "Confirmado pelo agente";
  fields: CollectionFields;
  photo: Blob;
  photoName: string;
  recognizedText: string;
}
