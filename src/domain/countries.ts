// Países de onde se envia carga para Cabo Verde (onde vive a diáspora e onde se compra).
// Não confundir com o país de origem/fabrico das mercadorias, que é um campo aduaneiro do item.
// Os nomes ficam aqui em português até existir i18n.

export interface DispatchCountry {
  /** ISO 3166-1 alfa-2 */
  code: string;
  name: string;
  dialCode: string;
}

export const dispatchCountries: DispatchCountry[] = [
  { code: "PT", name: "Portugal", dialCode: "+351" },
  { code: "ES", name: "Espanha", dialCode: "+34" },
  { code: "FR", name: "França", dialCode: "+33" },
  { code: "NL", name: "Países Baixos", dialCode: "+31" },
  { code: "BE", name: "Bélgica", dialCode: "+32" },
  { code: "LU", name: "Luxemburgo", dialCode: "+352" },
  { code: "IT", name: "Itália", dialCode: "+39" },
  { code: "DE", name: "Alemanha", dialCode: "+49" },
  { code: "GB", name: "Reino Unido", dialCode: "+44" },
  { code: "CH", name: "Suíça", dialCode: "+41" },
  { code: "US", name: "Estados Unidos", dialCode: "+1" },
  { code: "CA", name: "Canadá", dialCode: "+1" },
  { code: "BR", name: "Brasil", dialCode: "+55" },
  { code: "AR", name: "Argentina", dialCode: "+54" },
  { code: "SN", name: "Senegal", dialCode: "+221" },
  { code: "CN", name: "China", dialCode: "+86" },
];

export function getDispatchCountry(code: string) {
  return dispatchCountries.find((country) => country.code === code);
}
