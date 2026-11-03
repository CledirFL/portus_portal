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

// Fusos horários IANA de cada país. O fuso diz onde a pessoa está melhor do que
// a língua do navegador (um cabo-verdiano em França tem muitas vezes o navegador
// em português). Cabo Verde entra para não sugerir nada a quem já lá está.
const timeZoneCountries: Record<string, string[]> = {
  PT: ["Europe/Lisbon", "Atlantic/Madeira", "Atlantic/Azores"],
  ES: ["Europe/Madrid", "Atlantic/Canary", "Africa/Ceuta"],
  FR: ["Europe/Paris"],
  NL: ["Europe/Amsterdam"],
  BE: ["Europe/Brussels"],
  LU: ["Europe/Luxembourg"],
  IT: ["Europe/Rome"],
  DE: ["Europe/Berlin", "Europe/Busingen"],
  GB: ["Europe/London"],
  CH: ["Europe/Zurich"],
  US: [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Phoenix",
    "America/Anchorage",
    "America/Detroit",
    "America/Boise",
    "America/Indiana/",
    "America/Kentucky/",
    "America/North_Dakota/",
    "Pacific/Honolulu",
  ],
  CA: [
    "America/Toronto",
    "America/Montreal",
    "America/Vancouver",
    "America/Edmonton",
    "America/Winnipeg",
    "America/Regina",
    "America/Halifax",
    "America/Moncton",
    "America/St_Johns",
  ],
  BR: [
    "America/Sao_Paulo",
    "America/Fortaleza",
    "America/Recife",
    "America/Bahia",
    "America/Belem",
    "America/Maceio",
    "America/Manaus",
    "America/Cuiaba",
    "America/Campo_Grande",
    "America/Porto_Velho",
    "America/Boa_Vista",
    "America/Rio_Branco",
    "America/Araguaina",
    "America/Santarem",
    "America/Noronha",
  ],
  AR: ["America/Argentina/", "America/Buenos_Aires"],
  SN: ["Africa/Dakar"],
  CN: ["Asia/Shanghai", "Asia/Urumqi", "Asia/Chongqing", "Asia/Harbin"],
  CV: ["Atlantic/Cape_Verde"],
};

/** País do fuso horário; as entradas terminadas em "/" cobrem uma região inteira. */
export function countryFromTimeZone(timeZone: string) {
  return Object.entries(timeZoneCountries).find(([, zones]) =>
    zones.some((zone) => (zone.endsWith("/") ? timeZone.startsWith(zone) : timeZone === zone)),
  )?.[0];
}

export interface BrowserLocation {
  timeZone?: string;
  languages?: readonly string[];
}

/**
 * Sugere o país de onde a pessoa envia, entre os que têm agência. Decide o
 * fuso horário; a região da língua (ex.: "fr-FR") só conta quando o fuso é
 * genérico (UTC), porque o "en-US" aparece em navegadores do mundo inteiro.
 * Sem confiança suficiente não sugere nada.
 */
export function guessDispatchCountry({ timeZone, languages = [] }: BrowserLocation, availableCodes: string[]) {
  const isGenericZone = !timeZone || timeZone === "UTC" || timeZone.startsWith("Etc/");
  if (!isGenericZone) {
    const fromTimeZone = countryFromTimeZone(timeZone);
    return fromTimeZone && availableCodes.includes(fromTimeZone) ? fromTimeZone : undefined;
  }

  for (const language of languages) {
    const region = language.split("-")[1]?.toUpperCase();
    if (region && availableCodes.includes(region)) return region;
  }
  return undefined;
}

/** Fuso e línguas do navegador atual. */
export function readBrowserLocation(): BrowserLocation {
  return {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    languages: typeof navigator === "undefined" ? [] : navigator.languages,
  };
}
