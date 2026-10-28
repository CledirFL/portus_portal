import { describe, expect, it } from "vitest";
import { collectionFieldsSchema } from "@/modules/field-agent/schemas/collection";

const validFields = {
  senderName: "Atlantic Exports",
  senderPhone: "+351 912 345 678",
  recipientName: "Maria Lopes",
  recipientDocumentType: "NIF" as const,
  recipientDocumentNumber: "123456789",
  recipientPhone: "+238 991 112 233",
  contentDescription: "Roupa",
  weightKg: "2.5",
  volumeM3: "0.12",
  lengthCm: "",
  widthCm: "",
  heightCm: "",
};

describe("collectionFieldsSchema", () => {
  it("accepts a complete collection with a NIF and volume", () => {
    expect(collectionFieldsSchema.safeParse(validFields).success).toBe(true);
  });

  it("requires a nine-digit NIF and either a volume or all three dimensions", () => {
    expect(
      collectionFieldsSchema.safeParse({
        ...validFields,
        recipientDocumentNumber: "1234",
        volumeM3: "",
        lengthCm: "10",
        widthCm: "10",
      }).success,
    ).toBe(false);
  });

  it("accepts dimensions when the package volume is not known", () => {
    expect(
      collectionFieldsSchema.safeParse({
        ...validFields,
        volumeM3: "",
        lengthCm: "20",
        widthCm: "15",
        heightCm: "10",
      }).success,
    ).toBe(true);
  });
});
