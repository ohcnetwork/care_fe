import { MinimumVolumeSpec } from "@/types/emr/specimenDefinition/specimenDefinition";

export function formatQuantity(
  quantity: MinimumVolumeSpec | null | undefined,
): string {
  if (!quantity) return "N/A";
  if (quantity.string) return quantity.string;
  if (quantity.quantity?.value && quantity.quantity?.unit?.display) {
    return `${quantity.quantity.value} ${quantity.quantity.unit.display}`;
  }
  return "N/A";
}
