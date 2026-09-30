import {
  mockAuditRecords,
  mockCargo,
  mockConsignees,
  mockContainers,
  mockDocuments,
  mockExporters,
  mockSealRecords,
  mockVessels,
  mockVolumes,
} from "@/mocks/domain";

export interface PortalDataset {
  exporters: typeof mockExporters;
  consignees: typeof mockConsignees;
  consignes: typeof mockConsignees;
  cargo: typeof mockCargo;
  volumes: typeof mockVolumes;
  containers: typeof mockContainers;
  vessels: typeof mockVessels;
  documents: typeof mockDocuments;
  seals: typeof mockSealRecords;
  audits: typeof mockAuditRecords;
}

export async function fetchPortalData(): Promise<PortalDataset> {
  await new Promise((resolve) => setTimeout(resolve, 250));

  return {
    exporters: mockExporters,
    consignees: mockConsignees,
    consignes: mockConsignees,
    cargo: mockCargo,
    volumes: mockVolumes,
    containers: mockContainers,
    vessels: mockVessels,
    documents: mockDocuments,
    seals: mockSealRecords,
    audits: mockAuditRecords,
  };
}

export async function fetchExporters() {
  const data = await fetchPortalData();
  return data.exporters;
}

export async function fetchConsignees() {
  const data = await fetchPortalData();
  return data.consignes;
}

export async function fetchCargo() {
  const data = await fetchPortalData();
  return data.cargo;
}

export async function fetchVolumes() {
  const data = await fetchPortalData();
  return data.volumes;
}

export async function fetchContainers() {
  const data = await fetchPortalData();
  return data.containers;
}

export async function fetchVessels() {
  const data = await fetchPortalData();
  return data.vessels;
}

export async function fetchDocuments(type?: "BL" | "Manifesto" | "Gate Pass") {
  const data = await fetchPortalData();

  if (!type) {
    return data.documents;
  }

  return data.documents.filter((document) => document.type === type);
}

export async function fetchSeals() {
  const data = await fetchPortalData();
  return data.seals;
}

export async function fetchAudits() {
  const data = await fetchPortalData();
  return data.audits;
}
