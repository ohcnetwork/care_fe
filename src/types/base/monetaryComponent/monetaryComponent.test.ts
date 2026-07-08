// @vitest-environment jsdom
//
// jsdom is required here (rather than the default node environment) because
// monetaryComponent.ts imports CURRENCY_SYMBOL from a UI module that
// transitively pulls in React component code expecting a DOM.
import { describe, expect, it } from "vitest";

import { ConditionOperation } from "@/types/base/condition/condition";
import {
  calculateComponentAmount,
  calculateSubtotal,
  calculateTotalPrice,
  calculateTotalPriceWithQuantity,
  getBasePrice,
  getDiscountAmount,
  getPriceBreakdown,
  getSurchargeAmount,
  getTaxAmount,
  MonetaryComponent,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";
import { decimal } from "@/Utils/decimal";

describe("calculateComponentAmount", () => {
  it("computes percentage-based amounts as baseAmount * factor / 100", () => {
    const component: MonetaryComponent = {
      monetary_component_type: MonetaryComponentType.surcharge,
      factor: "10",
    };
    expect(calculateComponentAmount(component, decimal("100")).toString()).toBe(
      "10",
    );
  });

  it("computes fixed amounts as-is when factor is not set", () => {
    const component: MonetaryComponent = {
      monetary_component_type: MonetaryComponentType.surcharge,
      amount: "50",
    };
    expect(calculateComponentAmount(component, decimal("100")).toString()).toBe(
      "50",
    );
  });

  it("returns 0 when neither factor nor amount is set", () => {
    const component: MonetaryComponent = {
      monetary_component_type: MonetaryComponentType.surcharge,
    };
    expect(calculateComponentAmount(component, decimal("100")).toString()).toBe(
      "0",
    );
  });

  it("prefers factor over amount when both are set (factor precedence)", () => {
    const component: MonetaryComponent = {
      monetary_component_type: MonetaryComponentType.surcharge,
      factor: "10",
      amount: "50",
    };
    expect(calculateComponentAmount(component, decimal("100")).toString()).toBe(
      "10",
    );
  });
});

describe("getBasePrice", () => {
  it("returns the amount of the first base-type component", () => {
    const components: MonetaryComponent[] = [
      { monetary_component_type: MonetaryComponentType.informational },
      { monetary_component_type: MonetaryComponentType.base, amount: "100" },
      { monetary_component_type: MonetaryComponentType.base, amount: "999" },
    ];
    expect(getBasePrice(components).toString()).toBe("100");
  });

  it("returns 0 when there is no base component", () => {
    const components: MonetaryComponent[] = [
      {
        monetary_component_type: MonetaryComponentType.surcharge,
        factor: "10",
      },
    ];
    expect(getBasePrice(components).toString()).toBe("0");
  });

  it("returns 0 for an empty component list", () => {
    expect(getBasePrice([]).toString()).toBe("0");
  });
});

describe("getSurchargeAmount", () => {
  it("sums surcharges as percentages of the base amount", () => {
    const components: MonetaryComponent[] = [
      { monetary_component_type: MonetaryComponentType.base, amount: "100" },
      {
        monetary_component_type: MonetaryComponentType.surcharge,
        factor: "10",
      },
    ];
    expect(getSurchargeAmount(components).toString()).toBe("10");
  });

  it("returns 0 for an empty component list", () => {
    expect(getSurchargeAmount([]).toString()).toBe("0");
  });
});

describe("getDiscountAmount", () => {
  it("applies discounts to the base amount, not the running subtotal", () => {
    // base 100, surcharge 10% (=10) -> subtotal-so-far 110, but the discount
    // percentage is still computed against the base (100), not 110.
    const components: MonetaryComponent[] = [
      { monetary_component_type: MonetaryComponentType.base, amount: "100" },
      {
        monetary_component_type: MonetaryComponentType.surcharge,
        factor: "10",
      },
      {
        monetary_component_type: MonetaryComponentType.discount,
        factor: "20",
        conditions: [],
      },
    ];
    expect(getDiscountAmount(components).toString()).toBe("20");
  });

  it("excludes discounts with a non-empty conditions array", () => {
    const components: MonetaryComponent[] = [
      { monetary_component_type: MonetaryComponentType.base, amount: "100" },
      {
        monetary_component_type: MonetaryComponentType.discount,
        factor: "20",
        conditions: [
          {
            metric: "patient_gender",
            operation: ConditionOperation.equality,
            value: "male",
          },
        ],
      },
    ];
    expect(getDiscountAmount(components).toString()).toBe("0");
  });

  it("excludes discounts whose conditions field is undefined (pins current behavior: conditions must be an explicit empty array to apply — flagged for maintainer review)", () => {
    // `c.conditions?.length === 0` is false when `conditions` is undefined
    // (`undefined?.length === 0` evaluates to `undefined === 0` -> false), so a
    // discount with no `conditions` key at all is silently excluded, the same
    // as one with a populated conditions array. Pinned here as current
    // behavior, not necessarily intended behavior.
    const components: MonetaryComponent[] = [
      { monetary_component_type: MonetaryComponentType.base, amount: "100" },
      {
        monetary_component_type: MonetaryComponentType.discount,
        factor: "20",
        // no `conditions` key
      },
    ];
    expect(getDiscountAmount(components).toString()).toBe("0");
  });

  it("returns 0 for an empty component list", () => {
    expect(getDiscountAmount([]).toString()).toBe("0");
  });
});

describe("calculateSubtotal", () => {
  it("computes base + surcharges - discounts", () => {
    const components: MonetaryComponent[] = [
      { monetary_component_type: MonetaryComponentType.base, amount: "100" },
      {
        monetary_component_type: MonetaryComponentType.surcharge,
        factor: "10",
      },
      {
        monetary_component_type: MonetaryComponentType.discount,
        factor: "20",
        conditions: [],
      },
    ];
    // base 100 + surcharge 10 (10% of 100) - discount 20 (20% of 100) = 90
    expect(calculateSubtotal(components).toString()).toBe("90");
  });

  it("returns 0 for an empty component list", () => {
    expect(calculateSubtotal([]).toString()).toBe("0");
  });
});

describe("getTaxAmount", () => {
  it("computes tax on the subtotal (base + surcharge), not the base", () => {
    const components: MonetaryComponent[] = [
      { monetary_component_type: MonetaryComponentType.base, amount: "100" },
      {
        monetary_component_type: MonetaryComponentType.surcharge,
        factor: "10",
      },
      { monetary_component_type: MonetaryComponentType.tax, factor: "5" },
    ];
    // subtotal = 100 + 10 = 110; tax = 5% of 110 = 5.5 (not 5% of 100 = 5)
    expect(calculateSubtotal(components).toString()).toBe("110");
    expect(getTaxAmount(components).toString()).toBe("5.5");
  });

  it("returns 0 for an empty component list", () => {
    expect(getTaxAmount([]).toString()).toBe("0");
  });
});

describe("calculateTotalPrice / calculateTotalPriceWithQuantity", () => {
  it("computes subtotal + tax", () => {
    const components: MonetaryComponent[] = [
      { monetary_component_type: MonetaryComponentType.base, amount: "100" },
      {
        monetary_component_type: MonetaryComponentType.surcharge,
        factor: "10",
      },
      { monetary_component_type: MonetaryComponentType.tax, factor: "5" },
    ];
    expect(calculateTotalPrice(components).toString()).toBe("115.5");
  });

  it("multiplies the total price by quantity", () => {
    const components: MonetaryComponent[] = [
      { monetary_component_type: MonetaryComponentType.base, amount: "100" },
    ];
    expect(calculateTotalPriceWithQuantity(components, 3).toString()).toBe(
      "300",
    );
  });

  it("returns 0 for an empty component list", () => {
    expect(calculateTotalPrice([]).toString()).toBe("0");
  });
});

describe("getPriceBreakdown", () => {
  it("rounds every line item to 2 decimals and multiplies by quantity", () => {
    const components: MonetaryComponent[] = [
      { monetary_component_type: MonetaryComponentType.base, amount: "33.33" },
    ];
    const breakdown = getPriceBreakdown(components, 3);
    expect(breakdown).toEqual({
      basePrice: "99.99",
      surcharges: "0.00",
      discounts: "0.00",
      subtotal: "99.99",
      tax: "0.00",
      total: "99.99",
    });
  });

  it("defaults quantity to 1", () => {
    const components: MonetaryComponent[] = [
      { monetary_component_type: MonetaryComponentType.base, amount: "50" },
    ];
    expect(getPriceBreakdown(components).total).toBe("50.00");
  });

  it("returns zeroed strings for an empty component list without throwing", () => {
    expect(() => getPriceBreakdown([])).not.toThrow();
    expect(getPriceBreakdown([])).toEqual({
      basePrice: "0.00",
      surcharges: "0.00",
      discounts: "0.00",
      subtotal: "0.00",
      tax: "0.00",
      total: "0.00",
    });
  });
});
