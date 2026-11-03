"use client";

import { Input } from "@/components/ui/input";
import type { Volume, VolumeInput } from "@/services/api/shipments";

/** Volume no formulário (texto, como o utilizador escreve). */
export interface VolumeRow {
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  volumeM3: string;
  contents: string;
  sealed: boolean;
}

export const emptyVolume: VolumeRow = {
  weightKg: "",
  lengthCm: "",
  widthCm: "",
  heightCm: "",
  volumeM3: "",
  contents: "",
  sealed: true,
};

const toNumber = (value: string) => {
  const parsed = Number(value.replace(",", ".").trim());
  return value.trim() && Number.isFinite(parsed) ? parsed : undefined;
};

export function toVolumeInput(row: VolumeRow): VolumeInput {
  return {
    weightKg: toNumber(row.weightKg) ?? 0,
    lengthCm: toNumber(row.lengthCm),
    widthCm: toNumber(row.widthCm),
    heightCm: toNumber(row.heightCm),
    volumeM3: toNumber(row.volumeM3),
    contents: row.contents.trim() || undefined,
    sealed: row.sealed,
  };
}

export function toVolumeRow(volume: Volume): VolumeRow {
  const text = (value: number | null) => (value === null ? "" : String(value));
  return {
    weightKg: String(volume.weightKg),
    lengthCm: text(volume.lengthCm),
    widthCm: text(volume.widthCm),
    heightCm: text(volume.heightCm),
    // Só mostra m³ se não houver dimensões (senão é o valor calculado).
    volumeM3: volume.lengthCm ? "" : text(volume.volumeM3),
    contents: volume.contents ?? "",
    sealed: volume.sealed,
  };
}

interface VolumeFieldsProps {
  value: VolumeRow;
  onChange: (value: VolumeRow) => void;
  /** Erros da API por campo do volume (weightKg, volumeM3…). */
  errors?: Record<string, string>;
  idPrefix: string;
}

/** Peso e volume em m³ ou as três dimensões (BR 4). */
export function VolumeFields({ value, onChange, errors = {}, idPrefix }: VolumeFieldsProps) {
  const set = (key: keyof VolumeRow) => (event: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [key]: key === "sealed" ? event.target.checked : event.target.value });

  return (
    <div className="grid gap-3 sm:grid-cols-6">
      <div className="sm:col-span-1">
        <Input label="Peso (kg)" inputMode="decimal" value={value.weightKg} onChange={set("weightKg")} error={errors.weightKg} />
      </div>
      <Input label="C (cm)" inputMode="numeric" value={value.lengthCm} onChange={set("lengthCm")} error={errors.lengthCm} />
      <Input label="L (cm)" inputMode="numeric" value={value.widthCm} onChange={set("widthCm")} error={errors.widthCm} />
      <Input label="A (cm)" inputMode="numeric" value={value.heightCm} onChange={set("heightCm")} error={errors.heightCm} />
      <div className="sm:col-span-2">
        <Input
          label="ou volume (m³)"
          inputMode="decimal"
          value={value.volumeM3}
          onChange={set("volumeM3")}
          error={errors.volumeM3}
        />
      </div>
      <div className="sm:col-span-4">
        <Input label="Conteúdo (opcional)" value={value.contents} onChange={set("contents")} error={errors.contents} />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2 sm:mt-7" htmlFor={`${idPrefix}-sealed`}>
        <input
          id={`${idPrefix}-sealed`}
          type="checkbox"
          checked={value.sealed}
          onChange={set("sealed")}
          className="h-4 w-4 accent-brand-700"
        />
        Caixa fechada e selada
      </label>
    </div>
  );
}
