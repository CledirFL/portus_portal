import { z } from "zod";

export const collectionFieldsSchema = z
  .object({
    senderName: z.string().trim().min(2, "Indique o nome do remetente."),
    senderPhone: z.string().trim().min(5, "Indique o contacto do remetente."),
    recipientName: z.string().trim().min(2, "Indique o nome do destinatário."),
    recipientDocumentType: z.enum(["NIF", "BI", "Passaporte"]),
    recipientDocumentNumber: z.string().trim().min(3, "Indique o número do documento."),
    recipientPhone: z.string().trim().min(5, "Indique o contacto do destinatário."),
    contentDescription: z.string().trim().min(3, "Descreva o conteúdo da encomenda."),
    weightKg: z
      .string()
      .trim()
      .refine((value) => Number(value.replace(",", ".")) > 0, "O peso deve ser superior a zero."),
    volumeM3: z.string().trim(),
    lengthCm: z.string().trim(),
    widthCm: z.string().trim(),
    heightCm: z.string().trim(),
  })
  .superRefine((fields, context) => {
    if (fields.recipientDocumentType === "NIF" && !/^\d{9}$/.test(fields.recipientDocumentNumber)) {
      context.addIssue({
        code: "custom",
        message: "O NIF deve conter 9 algarismos.",
        path: ["recipientDocumentNumber"],
      });
    }

    const hasVolume = Number(fields.volumeM3.replace(",", ".")) > 0;
    const hasDimensions = [fields.lengthCm, fields.widthCm, fields.heightCm].every(
      (dimension) => Number(dimension.replace(",", ".")) > 0,
    );

    if (!hasVolume && !hasDimensions) {
      context.addIssue({
        code: "custom",
        message: "Indique o volume ou as três dimensões da encomenda.",
        path: ["volumeM3"],
      });
    }
  });

export type CollectionFormValues = z.infer<typeof collectionFieldsSchema>;

export const emptyCollectionFields: CollectionFormValues = {
  senderName: "",
  senderPhone: "",
  recipientName: "",
  recipientDocumentType: "NIF",
  recipientDocumentNumber: "",
  recipientPhone: "",
  contentDescription: "",
  weightKg: "",
  volumeM3: "",
  lengthCm: "",
  widthCm: "",
  heightCm: "",
};
