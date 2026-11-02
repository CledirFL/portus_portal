import { BrickWall, Car, Cog, Factory, Package, Sofa, Store, TriangleAlert, type LucideIcon } from "lucide-react";
import type { CargoTypeDefinition } from "@/domain/cargo-types";

const icons: Record<CargoTypeDefinition["icon"], LucideIcon> = {
  package: Package,
  car: Car,
  cog: Cog,
  brick: BrickWall,
  sofa: Sofa,
  factory: Factory,
  store: Store,
  alert: TriangleAlert,
};

export function CargoTypeIcon({ icon, className = "h-5 w-5" }: { icon: CargoTypeDefinition["icon"]; className?: string }) {
  const Icon = icons[icon];
  return <Icon className={className} strokeWidth={1.75} aria-hidden />;
}
