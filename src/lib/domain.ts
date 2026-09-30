import type {
  CargoRecord,
  ConsigneeProfile,
  ExporterProfile,
  VolumeRecord,
} from "@/types/domain";

export function filterByQuery<T extends object>(items: T[], query: string, keys: Array<keyof T>) {
  const value = query.trim().toLowerCase();

  if (!value) {
    return items;
  }

  return items.filter((item) =>
    keys.some((key) => {
      const candidate = item[key];
      return typeof candidate === "string" && candidate.toLowerCase().includes(value);
    }),
  );
}

export function getExporterStatusLabel(status: ExporterProfile["status"]) {
  return status === "active" ? "Ativo" : status === "review" ? "Em revisão" : "Bloqueado";
}

export function getVolumeStatusTone(status: VolumeRecord["status"]) {
  if (status === "Entregue") {
    return "success";
  }

  if (status === "Pendente") {
    return "warning";
  }

  if (status === "Carregado") {
    return "neutral";
  }

  return "danger";
}

export function getCargoStatusTone(status: CargoRecord["status"]) {
  if (status === "Concluído") {
    return "success";
  }

  if (status === "Em carga") {
    return "warning";
  }

  return "neutral";
}

export function getConsigneeLabel(profile: ConsigneeProfile) {
  return `${profile.name} · ${profile.country}`;
}
