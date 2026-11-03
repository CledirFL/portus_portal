import { describe, expect, it } from "vitest";
import { countryFromTimeZone, guessDispatchCountry } from "@/domain/countries";

const available = ["PT", "FR", "US", "BR"];

describe("countryFromTimeZone", () => {
  it("maps exact zones and whole regions", () => {
    expect(countryFromTimeZone("Europe/Lisbon")).toBe("PT");
    expect(countryFromTimeZone("Atlantic/Azores")).toBe("PT");
    expect(countryFromTimeZone("America/Indiana/Indianapolis")).toBe("US");
    expect(countryFromTimeZone("America/Argentina/Cordoba")).toBe("AR");
    expect(countryFromTimeZone("Asia/Tokyo")).toBeUndefined();
  });
});

describe("guessDispatchCountry", () => {
  it("prefers the time zone over the browser language", () => {
    // Cabo-verdiano em França com o navegador em português.
    expect(guessDispatchCountry({ timeZone: "Europe/Paris", languages: ["pt-PT"] }, available)).toBe("FR");
  });

  it("suggests nothing when the detected country has no agency", () => {
    expect(guessDispatchCountry({ timeZone: "Europe/Rome", languages: ["pt-PT"] }, available)).toBeUndefined();
  });

  it("suggests nothing to someone already in Cabo Verde", () => {
    expect(guessDispatchCountry({ timeZone: "Atlantic/Cape_Verde", languages: ["pt-PT"] }, available)).toBeUndefined();
  });

  it("ignores the language when the time zone points to another country", () => {
    expect(guessDispatchCountry({ timeZone: "Asia/Tokyo", languages: ["ja", "en-US"] }, available)).toBeUndefined();
  });

  it("falls back to the language region when the time zone is generic", () => {
    expect(guessDispatchCountry({ timeZone: "Etc/UTC", languages: ["en", "pt-BR"] }, available)).toBe("BR");
    expect(guessDispatchCountry({ languages: ["fr"] }, available)).toBeUndefined();
  });
});
