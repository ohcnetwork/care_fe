import {
  MonetaryComponent,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";

interface MonetaryComponentWithEffectiveAmount extends MonetaryComponent {
  effective_amount: number;
}

export function summarizeMonetaryComponents(components: MonetaryComponent[]) {
  let baseAmount = 0;
  let totalAmount = 0;
  const finalComponents: MonetaryComponentWithEffectiveAmount[] = [];

  // Process Base Price
  for (const component of components) {
    if (component.monetary_component_type === MonetaryComponentType.base) {
      baseAmount = component.amount || 0;
    }
  }

  totalAmount = baseAmount;
  finalComponents.push({
    monetary_component_type: MonetaryComponentType.base,
    amount: baseAmount,
    effective_amount: baseAmount,
  });

  // Process Surcharges
  for (const component of components) {
    if (component.monetary_component_type === MonetaryComponentType.surcharge) {
      if (component.factor != null) {
        const amount = (baseAmount * component.factor) / 100;
        finalComponents.push({
          ...component,
          effective_amount: amount,
        });
        totalAmount += amount;
      }
      if (component.amount != null) {
        finalComponents.push({
          ...component,
          effective_amount: component.amount,
        });
        totalAmount += component.amount;
      }
    }
  }

  const netAmount = totalAmount;

  // Process Discounts
  for (const component of components) {
    if (component.monetary_component_type === MonetaryComponentType.discount) {
      if (component.factor != null) {
        const amount = (netAmount * component.factor) / 100;
        finalComponents.push({
          ...component,
          effective_amount: amount,
        });
        totalAmount = Math.max(0, totalAmount - amount);
      }
      if (component.amount != null) {
        finalComponents.push({
          ...component,
          effective_amount: component.amount,
        });
        totalAmount = Math.max(0, totalAmount - component.amount);
      }
    }
  }
  const taxableAmount = totalAmount;

  // Process Taxes
  for (const component of components) {
    if (component.monetary_component_type === MonetaryComponentType.tax) {
      if (component.factor != null) {
        const amount = (taxableAmount * component.factor) / 100;
        finalComponents.push({
          ...component,
          effective_amount: amount,
        });
        totalAmount += amount;
      }
      if (component.amount != null) {
        finalComponents.push({
          ...component,
          effective_amount: component.amount,
        });
        totalAmount += component.amount;
      }
    }
  }

  return { baseAmount, netAmount, taxableAmount, totalAmount, finalComponents };
}
