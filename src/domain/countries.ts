// Países de origem. Cabo Verde importa de muitos países; Portugal é só um deles.
// Os nomes ficam aqui em português até existir i18n.

export interface OriginCountry {
  /** ISO 3166-1 alfa-2 */
  code: string;
  name: string;
  dialCode: string;
}

export const originCountries: OriginCountry[] = [
  { code: "PT", name: "Portugal", dialCode: "+351" },
  { code: "ES", name: "Espanha", dialCode: "+34" },
  { code: "FR", name: "França", dialCode: "+33" },
  { code: "NL", name: "Países Baixos", dialCode: "+31" },
  { code: "BE", name: "Bélgica", dialCode: "+32" },
  { code: "LU", name: "Luxemburgo", dialCode: "+352" },
  { code: "IT", name: "Itália", dialCode: "+39" },
  { code: "DE", name: "Alemanha", dialCode: "+49" },
  { code: "GB", name: "Reino Unido", dialCode: "+44" },
  { code: "US", name: "Estados Unidos", dialCode: "+1" },
  { code: "BR", name: "Brasil", dialCode: "+55" },
  { code: "SN", name: "Senegal", dialCode: "+221" },
  { code: "CN", name: "China", dialCode: "+86" },
];

export function getOriginCountry(code: string) {
  return originCountries.find((country) => country.code === code);
}
