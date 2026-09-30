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

export type ContainerStatus = "Em inspeção" | "Liberado" | "Aguardando descarga" | "Em trânsito";
export type VesselStatus = "Em rota" | "Atracado" | "Em operação";
export type DocumentStatus = "Validado" | "Pendente" | "Em revisão" | "Atrasado";
export type SealStatus = "Aprovada" | "Pendente" | "Em revisão";
export type AuditResult = "Conforme" | "Observações" | "Não conforme";

export interface ContainerRecord {
  id: string;
  containerNumber: string;
  vesselId: string;
  cargoId: string;
  route: string;
  port: string;
  status: ContainerStatus;
}

export interface VesselRecord {
  id: string;
  name: string;
  route: string;
  port: string;
  status: VesselStatus;
  eta: string;
  cargoIds: string[];
}

export interface DocumentRecord {
  id: string;
  type: "BL" | "Manifesto" | "Gate Pass";
  reference: string;
  shipper: string;
  consignee: string;
  status: DocumentStatus;
  vesselId: string;
  eta: string;
}

export interface SealRecord {
  id: string;
  code: string;
  vesselId: string;
  cargoId: string;
  status: SealStatus;
  team: string;
}

export interface AuditRecord {
  id: string;
  scope: string;
  result: AuditResult;
  assignee: string;
  vesselId: string;
  cargoId: string;
}
