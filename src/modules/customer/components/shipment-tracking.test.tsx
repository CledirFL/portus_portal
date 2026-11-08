import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ShipmentTracking } from "@/domain/shipment-request";
import { ShipmentTimeline, ShipmentTrackingDetails, TrackingStageBadge } from "@/modules/customer/components/shipment-tracking";

const portKeys = ["received", "labelled", "consolidated", "in_transit", "arrived", "cleared", "delivered"];
const vehicleKeys = ["received", "labelled", "consolidated", "in_transit", "arrived", "assessed", "inspected", "duties_paid", "cleared", "delivered"];
const agencyKeys = ["received", "labelled", "consolidated", "in_transit", "arrived", "cleared", "to_agency", "at_agency", "delivered"];
const steps = (reached: number, keys = portKeys) =>
  keys.map((key, index) => ({
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

  it("tells the customer when a small parcel is waiting at the Cabo Verde agency", () => {
    const cleared: ShipmentTracking = { ...base, stage: "cleared", steps: steps(5, agencyKeys) };
    const { unmount } = render(
      <>
        <TrackingStageBadge tracking={cleared} />
        <ShipmentTimeline tracking={cleared} />
      </>,
    );
    expect(screen.getByText("Liberada pela Alfândega")).toBeInTheDocument();
    expect(screen.getByText(/A agência em Cabo Verde vai levantá-la no porto/)).toBeInTheDocument();
    unmount();

    const atAgency: ShipmentTracking = {
      ...cleared,
      stage: "at_agency",
      steps: steps(7, agencyKeys),
      pickup: { code: "LEV-4H7K2P", port: "Morabeza Praia, Achada Santo António, Praia", balanceCve: 0 },
    };
    render(
      <>
        <TrackingStageBadge tracking={atAgency} />
        <ShipmentTrackingDetails tracking={atAgency} />
      </>,
    );
    expect(screen.getByText("Pronta na agência")).toBeInTheDocument();
    expect(screen.getByText("Pronta para levantar em Morabeza Praia, Achada Santo António, Praia")).toBeInTheDocument();
    expect(screen.getByText(/leva o documento do destinatário e este código/)).toBeInTheDocument();
  });

  it("guides the vehicle owner through the clearance milestones", () => {
    const arrived: ShipmentTracking = { ...base, stage: "arrived", steps: steps(4, vehicleKeys) };
    const { unmount } = render(<ShipmentTimeline tracking={arrived} />);
    expect(screen.getByText(/Faça o desalfandegamento em As minhas viaturas/)).toBeInTheDocument();
    unmount();

    const assessed: ShipmentTracking = { ...base, stage: "assessed", steps: steps(5, vehicleKeys) };
    render(
      <>
        <TrackingStageBadge tracking={assessed} />
        <ShipmentTimeline tracking={assessed} />
      </>,
    );
    expect(screen.getByText("Direitos liquidados")).toBeInTheDocument();
    expect(screen.getByText(/Segue-se a inspeção técnica da DGTR/)).toBeInTheDocument();
  });
});
