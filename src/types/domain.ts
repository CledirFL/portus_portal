export type ExporterStatus = "active" | "review" | "blocked";
export type VolumeStatus = "Pendente" | "Em armazém" | "Carregado" | "Entregue";
export type CargoStatus = "Agendado" | "Em carga" | "Concluído";

export interface ExporterProfile {
  id: string;
  legalName: string;
  country: string;
  contacts: string;
  commercialLicense: string;
  status: ExporterStatus;
  createdAt: string;
}

export interface ConsigneeProfile {
  id: string;
  name: string;
  nif: string;
  documentType: "Passaporte" | "BI" | "NIF";
  documentNumber: string;
  phone: string;
  address: string;
  country: string;
}

export interface CargoRecord {
  id: string;
  cargoType: string;
  description: string;
  hsCode: string;
  commercialValue: string;
  countryOfOrigin: string;
  status: CargoStatus;
  exporterId: string;
  consigneeId: string;
}

export interface VolumeRecord {
  id: string;
  globalVolumeId: string;
  qrCode: string;
  weightKg: string;
  volumeM3: string;
  description: string;
  status: VolumeStatus;
  cargoId: string;
  exporterId: string;
  consigneeId: string;
  route: string;
}
