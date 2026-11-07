// Encomendas pequenas: em Cabo Verde, uma agência parceira despacha-as, leva-as para a sua agência e entrega-as
// ao destinatário. A restante carga continua a ser levantada no porto (o servidor volta a decidir).
import type { CargoCategory } from "@/domain/cargo-types";

export function deliveredByAgency(category: CargoCategory) {
  return category === "encomenda_pequena";
}
