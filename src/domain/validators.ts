// Validadores de identificadores usados em vários fluxos (RF-A08, RF-A40, BR 3).

const iso6346LetterValues: Record<string, number> = (() => {
  // A=10 e saltam-se os múltiplos de 11 (11, 22, 33), conforme a norma.
  const values: Record<string, number> = {};
  let value = 10;
  for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
    if (value % 11 === 0) {
      value += 1;
    }
    values[letter] = value;
    value += 1;
  }
  return values;
})();

export function normalizeContainerNumber(input: string) {
  return input.replace(/[\s-]/g, "").toUpperCase();
}

export function computeIso6346CheckDigit(firstTen: string) {
  const code = normalizeContainerNumber(firstTen);
  if (!/^[A-Z]{3}[UJZ]\d{6}$/.test(code)) {
    return null;
  }

  const sum = [...code].reduce((total, char, index) => {
    const value = /\d/.test(char) ? Number(char) : iso6346LetterValues[char];
    return total + value * 2 ** index;
  }, 0);

  return (sum % 11) % 10;
}

export type ContainerNumberResult =
  | { valid: true; normalized: string }
  | { valid: false; reason: "format" | "check-digit"; expectedCheckDigit?: number };

export function validateContainerNumber(input: string): ContainerNumberResult {
  const normalized = normalizeContainerNumber(input);

  if (!/^[A-Z]{3}[UJZ]\d{7}$/.test(normalized)) {
    return { valid: false, reason: "format" };
  }

  const expected = computeIso6346CheckDigit(normalized.slice(0, 10));
  if (expected !== Number(normalized[10])) {
    return { valid: false, reason: "check-digit", expectedCheckDigit: expected ?? undefined };
  }

  return { valid: true, normalized };
}

const vinTransliteration: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};
const vinWeights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

export function computeVinCheckDigit(vin: string) {
  const sum = [...vin].reduce((total, char, index) => {
    const value = /\d/.test(char) ? Number(char) : vinTransliteration[char];
    return total + value * vinWeights[index];
  }, 0);
  const remainder = sum % 11;
  return remainder === 10 ? "X" : String(remainder);
}

export type VinResult =
  | { valid: true; normalized: string; checkDigit: "ok" | "not-required" }
  | { valid: false; reason: "length" | "characters" | "check-digit" };

/**
 * O dígito de controlo (posição 9) só é obrigatório em VIN norte-americanos
 * (WMI a começar por 1–5). Nos europeus é frequente não ser usado, por isso
 * uma divergência aí é só aviso.
 */
export function validateVin(input: string): VinResult {
  const normalized = input.replace(/\s/g, "").toUpperCase();

  if (normalized.length !== 17) {
    return { valid: false, reason: "length" };
  }

  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(normalized)) {
    return { valid: false, reason: "characters" };
  }

  const matches = computeVinCheckDigit(normalized) === normalized[8];
  const requiresCheckDigit = /^[1-5]/.test(normalized);

  if (matches) {
    return { valid: true, normalized, checkDigit: "ok" };
  }

  if (requiresCheckDigit) {
    return { valid: false, reason: "check-digit" };
  }

  return { valid: true, normalized, checkDigit: "not-required" };
}

export function isValidCaboVerdeNif(input: string) {
  return /^\d{9}$/.test(input.replace(/\s/g, ""));
}

export function isValidPortugalNif(input: string) {
  const nif = input.replace(/\s/g, "");
  if (!/^[1235689]\d{8}$/.test(nif) && !/^(45|70|71|72|74|75|77|79|90|91|98|99)\d{7}$/.test(nif)) {
    return false;
  }

  const sum = [...nif.slice(0, 8)].reduce((total, digit, index) => total + Number(digit) * (9 - index), 0);
  const check = 11 - (sum % 11);
  return (check >= 10 ? 0 : check) === Number(nif[8]);
}

const phoneRules: Record<string, { label: string; digits: number }> = {
  "238": { label: "Cabo Verde", digits: 7 },
  "351": { label: "Portugal", digits: 9 },
};

export function normalizePhone(input: string) {
  const trimmed = input.replace(/[\s().-]/g, "");
  return trimmed.startsWith("00") ? `+${trimmed.slice(2)}` : trimmed;
}

/** BR 3: o telefone inclui indicativo do país e comprimento válido. */
export function validatePhone(input: string): { valid: boolean; message?: string } {
  const phone = normalizePhone(input);

  if (!/^\+\d+$/.test(phone)) {
    return { valid: false, message: "Inclua o indicativo do país, por exemplo +238 ou +351." };
  }

  for (const [code, rule] of Object.entries(phoneRules)) {
    if (phone.startsWith(`+${code}`)) {
      const local = phone.slice(code.length + 1);
      return local.length === rule.digits
        ? { valid: true }
        : { valid: false, message: `Um número de ${rule.label} tem ${rule.digits} algarismos após +${code}.` };
    }
  }

  const digits = phone.length - 1;
  return digits >= 8 && digits <= 15
    ? { valid: true }
    : { valid: false, message: "Número de telefone inválido." };
}
