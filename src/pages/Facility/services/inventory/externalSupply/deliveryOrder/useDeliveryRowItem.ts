import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";

import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { Code } from "@/types/base/code/code";
import {
  MonetaryComponent,
  MonetaryComponentRead,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";
import {
  MRP_CODE,
  getComponentsFromChargeItem,
} from "@/types/billing/chargeItem/chargeItem";
import { InventoryRead } from "@/types/inventory/product/inventory";
import inventoryApi from "@/types/inventory/product/inventoryApi";
import { ProductRead } from "@/types/inventory/product/product";
import productApi from "@/types/inventory/product/productApi";
import query from "@/Utils/request/query";

import { add, divide, multiply, round } from "@/Utils/decimal";
import { dateQueryString } from "@/Utils/utils";
import {
  SupplyDeliveryFormValues,
  SupplyDeliveryItemValues,
} from "./AddSupplyDeliveryForm";

type ItemPath = `items.${number}.${keyof SupplyDeliveryItemValues}`;

interface UseDeliveryRowItemProps {
  form: UseFormReturn<SupplyDeliveryFormValues>;
  index: number;
  /** Location ID for fetching inventory (origin location for internal transfers) */
  locationId?: string;
}

/**
 * Custom hook that manages all state and logic for a delivery row item.
 * Consolidates multiple useWatch calls and provides clean APIs for mutations.
 */
export function useDeliveryRowItem({
  form,
  index,
  locationId,
}: UseDeliveryRowItemProps) {
  const { facilityId, facility: facilityData } = useCurrentFacility();
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Consolidated watch for all item fields - avoids multiple useWatch calls
  const item = useWatch({
    control: form.control,
    name: `items.${index}`,
  });

  const {
    product_knowledge: productKnowledge,
    supplied_item: suppliedItem,
    batch_number: batchNumber,
    unit_price: unitPrice,
    purchase_price: purchasePrice,
    total_purchase_price: totalPurchasePrice,
    supplied_item_quantity: quantity = "",
    supplied_item_pack_quantity: packQuantity,
    supplied_item_pack_size: packSize,
    tax_components: taxComponents,
    discount_components: discountComponents,
    informational_components: informationalComponents,
    charge_item_category: chargeItemCategory,
    is_tax_inclusive: isTaxInclusive,
    is_total_purchase_price_edited: isTotalPurchasePriceEdited,
    is_charge_item_edited: isChargeItemEdited,
    _created_charge_item_definition: createdChargeItemDefinition,
    _created_product: createdProduct,
    replaces_delivery: replacesDelivery,
  } = item || {};
  const isReplacement = Boolean(replacesDelivery);

  // Helper to set a form field value
  const setField = useCallback(
    <K extends keyof SupplyDeliveryItemValues>(
      field: K,
      value: SupplyDeliveryItemValues[K],
    ) => {
      form.setValue(`items.${index}.${field}` as ItemPath, value);
    },
    [form, index],
  );

  // Reset all item fields when product knowledge changes
  const resetFields = useCallback(() => {
    const fieldsToReset: Partial<SupplyDeliveryItemValues> = {
      supplied_item: undefined,
      batch_number: "",
      expiry_date: "",
      charge_item_definition: undefined,
      _created_charge_item_definition: undefined,
      _created_product: undefined,
      unit_price: "0",
      purchase_price: undefined,
      total_purchase_price: undefined,
      informational_components: [],
      tax_components: [],
      discount_components: [],
      charge_item_category: undefined,
      is_manually_edited: false,
      is_total_purchase_price_edited: false,
      is_charge_item_edited: false,
      supplied_item_pack_quantity: undefined,
      supplied_item_pack_size: 1,
      supplied_item_quantity: "",
    };

    Object.entries(fieldsToReset).forEach(([field, value]) => {
      setField(field as keyof SupplyDeliveryItemValues, value);
    });
    setIsCreatingNew(false);
  }, [setField]);

  // Keep the reference product until preparation succeeds so retries retain its metadata.
  const markAsEdited = useCallback(
    (chargeItemChanged = false) => {
      setField("is_manually_edited", true);
      if (chargeItemChanged) {
        setField("is_charge_item_edited", true);
      }
      setField("_created_charge_item_definition", undefined);
      setField("_created_product", undefined);
      setIsCreatingNew(true);
    },
    [setField],
  );

  // Fetch products for selected product knowledge
  const { data: productsResponse, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products", facilityId, productKnowledge?.slug],
    queryFn: query(productApi.listProduct, {
      pathParams: { facilityId },
      queryParams: {
        product_knowledge: productKnowledge?.slug,
        ordering: "-created_date",
        limit: 100,
        status: "active",
      },
    }),
    enabled: !!productKnowledge?.slug,
  });

  const products = useMemo(
    () => productsResponse?.results || [],
    [productsResponse?.results],
  );

  // Fetch inventory for location to get net_content (stock levels)
  const { data: inventoryResponse, isLoading: isLoadingInventory } = useQuery({
    queryKey: ["inventory", facilityId, locationId, productKnowledge?.slug],
    queryFn: query(inventoryApi.list, {
      pathParams: { facilityId, locationId: locationId! },
      queryParams: {
        product_knowledge: productKnowledge?.id,
        limit: 100,
      },
    }),
    enabled: !!facilityId && !!locationId && !!productKnowledge?.id,
  });

  // Map product IDs to their inventory net_content
  const inventoryByProductId = useMemo(() => {
    const map = new Map<string, InventoryRead>();
    inventoryResponse?.results?.forEach((inv) => {
      map.set(inv.product.id, inv);
    });
    return map;
  }, [inventoryResponse?.results]);

  // Fill form from existing product
  const fillFromProduct = useCallback(
    (product: ProductRead) => {
      const currentPackQuantity = form.getValues(
        `items.${index}.supplied_item_pack_quantity`,
      );
      const currentTotalPurchasePrice = form.getValues(
        `items.${index}.total_purchase_price`,
      );
      resetFields();

      setField("supplied_item", product);
      setField("supplied_item_pack_quantity", currentPackQuantity);
      setField("purchase_price", product.purchase_price ?? undefined);
      if (isReplacement) {
        setField("total_purchase_price", currentTotalPurchasePrice);
      }
      setField("batch_number", product.batch?.lot_number || "");
      if (product.expiration_date) {
        setField("expiry_date", dateQueryString(product.expiration_date));
      }
      if (product.standard_pack_size) {
        setField("supplied_item_pack_size", product.standard_pack_size);
      }

      const chargeItemDef = product.charge_item_definition;
      if (chargeItemDef) {
        setField("charge_item_definition", chargeItemDef);

        if (chargeItemDef.category?.slug) {
          setField("charge_item_category", chargeItemDef.category.slug);
        }

        const baseComponents = getComponentsFromChargeItem(
          chargeItemDef,
          MonetaryComponentType.base,
        );
        if (baseComponents[0]?.amount) {
          setField("unit_price", baseComponents[0].amount);
        }

        const informational = getComponentsFromChargeItem(
          chargeItemDef,
          MonetaryComponentType.informational,
        );
        if (informational.length) {
          setField("informational_components", informational);
        }

        const taxes = getComponentsFromChargeItem(
          chargeItemDef,
          MonetaryComponentType.tax,
        );
        if (taxes.length) {
          setField("tax_components", taxes);
        }

        const discounts = getComponentsFromChargeItem(
          chargeItemDef,
          MonetaryComponentType.discount,
        );
        if (discounts.length) {
          setField("discount_components", discounts);
        }
      }
    },
    [resetFields, setField, form, index, isReplacement],
  );

  // Auto-fill from last product when product knowledge is selected
  useEffect(() => {
    const isManuallyEdited = form.getValues(
      `items.${index}.is_manually_edited`,
    );
    if (products.length > 0 && !suppliedItem && !isManuallyEdited) {
      fillFromProduct(products[0]);
    }
  }, [products, suppliedItem, index, form, fillFromProduct]);

  // Whether category selection is needed for charge item definition
  const needsCategorySelection = useMemo(() => {
    if (!productKnowledge) return false;
    if (isCreatingNew) return true;
    if (suppliedItem?.charge_item_definition?.category) return false;
    return products.length === 0;
  }, [productKnowledge, suppliedItem, products.length, isCreatingNew]);

  // Available tax components from facility
  const availableTaxes = useMemo(
    () =>
      (facilityData?.instance_tax_monetary_components ||
        []) as MonetaryComponentRead[],
    [facilityData],
  );

  // Available discount components from facility
  const availableDiscounts = useMemo(
    () =>
      [
        ...(facilityData?.discount_monetary_components || []),
        ...(facilityData?.instance_discount_monetary_components || []),
      ] as MonetaryComponentRead[],
    [facilityData],
  );

  // MRP value from informational components
  const mrpValue = useMemo(() => {
    const mrpComponent = informationalComponents?.find(
      (c) => c.code?.code === MRP_CODE,
    );
    return mrpComponent?.amount ? parseFloat(mrpComponent.amount) : 0;
  }, [informationalComponents]);

  // Total tax factor for tax-inclusive calculation (as string to avoid referential equality issues)
  const totalTaxFactor = useMemo(() => {
    if (!taxComponents?.length) return "0";
    return add(...taxComponents.map((tax) => tax.factor || 0)).toString();
  }, [taxComponents]);

  // Calculate base price from MRP when tax inclusive is enabled
  useEffect(() => {
    if (isTaxInclusive && isChargeItemEdited && mrpValue > 0) {
      let calculatedBasePrice = divide(
        mrpValue,
        add(1, divide(totalTaxFactor, 100)),
      );
      if (packSize && packSize > 0)
        calculatedBasePrice = divide(calculatedBasePrice, packSize);
      const newUnitPrice = round(calculatedBasePrice);
      // Only update if value actually changed to prevent infinite loops
      if (newUnitPrice !== unitPrice) {
        setField("unit_price", newUnitPrice);
      }
    }
  }, [
    isTaxInclusive,
    isChargeItemEdited,
    mrpValue,
    totalTaxFactor,
    packSize,
    unitPrice,
    setField,
  ]);

  // Auto-calculate quantity when pack quantity or pack size changes
  const hasValidPackQuantity =
    Number.isInteger(packQuantity) && (packQuantity ?? 0) > 0;
  const hasValidPackSize = Number.isInteger(packSize) && (packSize ?? 0) > 0;
  useEffect(() => {
    const calculatedQuantity =
      hasValidPackQuantity && hasValidPackSize
        ? round(multiply(packQuantity!, packSize!))
        : "";
    if (calculatedQuantity !== quantity) {
      setField("supplied_item_quantity", calculatedQuantity);
    }
  }, [
    packQuantity,
    packSize,
    hasValidPackQuantity,
    hasValidPackSize,
    quantity,
    setField,
  ]);

  // TPR is the price of one pack (purchase_price × pack_size), not a line total.
  // New rows derive it from the selected product once a pack quantity is entered.
  // Manual totals and saved delivery totals remain under the user's control.
  useEffect(() => {
    if (
      !isReplacement &&
      suppliedItem &&
      !isTotalPurchasePriceEdited &&
      !createdChargeItemDefinition &&
      !createdProduct
    ) {
      const knownPurchasePrice = suppliedItem.purchase_price ?? undefined;
      const calculatedTotal =
        knownPurchasePrice != null && hasValidPackQuantity && hasValidPackSize
          ? round(multiply(knownPurchasePrice, packSize!))
          : undefined;
      if (calculatedTotal !== totalPurchasePrice) {
        setField("total_purchase_price", calculatedTotal);
      }
      if (purchasePrice !== knownPurchasePrice) {
        setField("purchase_price", knownPurchasePrice);
      }
      return;
    }

    if (totalPurchasePrice && hasValidPackSize && hasValidPackQuantity) {
      const newPurchasePrice = round(divide(totalPurchasePrice, packSize!));
      if (newPurchasePrice !== purchasePrice) {
        setField("purchase_price", newPurchasePrice);
      }
    } else {
      if (purchasePrice && !isReplacement) {
        setField("purchase_price", undefined);
      }
    }
  }, [
    totalPurchasePrice,
    packSize,
    packQuantity,
    hasValidPackQuantity,
    hasValidPackSize,
    purchasePrice,
    isReplacement,
    suppliedItem,
    isTotalPurchasePriceEdited,
    createdChargeItemDefinition,
    createdProduct,
    setField,
  ]);

  // Update informational component
  const updateInformationalComponent = useCallback(
    (code: Code, value: number) => {
      const newComponent: MonetaryComponent = {
        monetary_component_type: MonetaryComponentType.informational,
        amount: value.toString(),
        code,
      };
      const updated: MonetaryComponent[] = [
        ...(informationalComponents || []).filter(
          (c) => c.code?.code !== code.code,
        ),
        ...(value > 0 ? [newComponent] : []),
      ];
      setField("informational_components", updated);
      markAsEdited(true);
    },
    [informationalComponents, setField, markAsEdited],
  );

  return {
    // Item values
    productKnowledge,
    suppliedItem,
    batchNumber,
    unitPrice,
    purchasePrice,
    totalPurchasePrice,
    quantity,
    packQuantity,
    packSize,
    taxComponents,
    discountComponents,
    informationalComponents,
    chargeItemCategory,
    isTaxInclusive,

    // Computed values
    needsCategorySelection,
    isCreatingNew,
    isLoadingProducts,
    isLoadingInventory,
    products,
    inventoryByProductId,
    availableTaxes,
    availableDiscounts,

    // Actions
    setField,
    resetFields,
    markAsEdited,
    fillFromProduct,
    updateInformationalComponent,
  };
}
