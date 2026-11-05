import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ShipmentTracking } from "@/domain/shipment-request";
import { ShipmentTimeline, ShipmentTrackingDetails } from "@/modules/customer/components/shipment-tracking";

const steps = (reached: number) =>
  ["received", "labelled", "consolidated", "in_transit", "arrived", "cleared", "delivered"].map((key, index) => ({
    key: key as ShipmentTracking["steps"][number]["key"],
    label: `Passo ${key}`,
    done: index <= reached,
    at: index <= reached ? "2026-11-05T10:00:00.000Z" : null,
  }));

const base: ShipmentTracking = {
  shipmentCode: "ENC-7KQ2M9",
  volumes: 2,
  stage: "in_transit",
  steps: steps(3),
  voyage: { vesselName: "Sorel", arrivalPort: "Porto da Praia, Santiago", eta: "2026-11-12T08:00:00.000Z", departedAt: "2026-11-05T10:00:00.000Z", arrivedAt: null },
  pickup: null,
};

describe("shipment tracking", () => {
  it("describes the current milestone and the expected arrival", () => {
    render(
      <>
        <ShipmentTimeline tracking={base} />
        <ShipmentTrackingDetails tracking={base} />
      </>,
    );
    expect(screen.getByText("A carga está a caminho de Cabo Verde.")).toBeInTheDocument();
    expect(screen.getByText("Sorel → Porto da Praia, Santiago", { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/Chegada prevista/)).toBeInTheDocument();
  });

  it("shows the pickup code and charges when the cargo is ready", () => {
    render(
      <ShipmentTrackingDetails
        tracking={{ ...base, stage: "cleared", steps: steps(5), pickup: { code: "LEV-4H7K2P", port: "Porto da Praia, Santiago", balanceCve: 1250 } }}
      />,
    );
    expect(screen.getByText("LEV-4H7K2P")).toBeInTheDocument();
    expect(screen.getByText("1250,00 CVE", { exact: false })).toBeInTheDocument();
    expect(screen.queryByText(/Chegada prevista/)).not.toBeInTheDocument();
  });
});
