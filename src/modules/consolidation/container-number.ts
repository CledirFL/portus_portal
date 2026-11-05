import { validateContainerNumber } from "@/domain/validators";

/** Mensagem do nº ISO 6346 enquanto se escreve (RF-A08); vazia quando é válido ou ainda está incompleto. */
export function containerNumberHint(value: string) {
  const compact = value.replace(/[\s-]/g, "");
  if (compact.length < 11) return "";
  const result = validateContainerNumber(value);
  if (result.valid) return "";
  return result.reason === "format"
    ? "Formato: 4 letras (a última U, J ou Z) e 7 algarismos."
    : `Dígito de controlo errado: o último algarismo devia ser ${result.expectedCheckDigit}.`;
}
