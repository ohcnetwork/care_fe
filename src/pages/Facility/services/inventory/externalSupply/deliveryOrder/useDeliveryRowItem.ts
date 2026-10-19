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

import { add, divide, isEqual, multiply, round } from "@/Utils/decimal";
import { dateQueryString } from "@/Utils/utils";
import {
  SupplyDeliveryFormValues,
  SupplyDeliveryItemValues,
} from "./AddSupplyDeliveryForm";

type ItemPath = `items.${number}.${keyof SupplyDeliveryItemValues}`;

function calculatePurchasePrice(packPrice?: string, packSize?: number) {
  return packPrice != null &&
    packSize != null &&
    Number.isInteger(packSize) &&
    packSize > 0
    ? round(divide(packPrice, packSize))
    : undefined;
}

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
    is_charge_item_edited: isChargeItemEdited,
  } = item || {};

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

  // TPR is the purchase price per pack. Only pricing edits recalculate PR.
  const updateTotalPurchasePrice = useCallback(
    (value?: string) => {
      const current = form.getValues(`items.${index}`);
      if (isEqual(value, current.total_purchase_price)) return;

      setField("total_purchase_price", value);
      setField("is_total_purchase_price_edited", true);
      setField(
        "purchase_price",
        calculatePurchasePrice(value, current.supplied_item_pack_size),
      );
      markAsEdited();
    },
    [form, index, setField, markAsEdited],
  );

  const updatePackSize = useCallback(
    (value?: number) => {
      const current = form.getValues(`items.${index}`);
      if (value === current.supplied_item_pack_size) return;

      setField("supplied_item_pack_size", value);
      setField(
        "purchase_price",
        calculatePurchasePrice(current.total_purchase_price, value),
      );
      markAsEdited(Boolean(isTaxInclusive));
    },
    [form, index, setField, markAsEdited, isTaxInclusive],
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
      const {
        supplied_item_pack_quantity: currentPackQuantity,
        supplied_item_pack_size: currentPackSize,
        purchase_price: currentPurchasePrice,
        total_purchase_price: currentTotalPurchasePrice,
        is_total_purchase_price_edited: isTotalPurchasePriceEdited,
        replaces_delivery: replacesDelivery,
      } = form.getValues(`items.${index}`);
      const nextPackSize = product.standard_pack_size || 1;
      const preservePackPrice =
        Boolean(replacesDelivery) || isTotalPurchasePriceEdited;
      const knownPurchasePrice = product.purchase_price ?? undefined;
      const nextTotalPurchasePrice = preservePackPrice
        ? currentTotalPurchasePrice
        : knownPurchasePrice != null
          ? round(multiply(knownPurchasePrice, nextPackSize))
          : undefined;
      resetFields();

      setField("supplied_item", product);
      setField("supplied_item_pack_quantity", currentPackQuantity);
      setField("supplied_item_pack_size", nextPackSize);
      setField("total_purchase_price", nextTotalPurchasePrice);
      setField("is_total_purchase_price_edited", isTotalPurchasePriceEdited);
      setField(
        "purchase_price",
        preservePackPrice
          ? currentPackSize === nextPackSize
            ? currentPurchasePrice
            : calculatePurchasePrice(nextTotalPurchasePrice, nextPackSize)
          : knownPurchasePrice,
      );
      setField("batch_number", product.batch?.lot_number || "");
      if (product.expiration_date) {
        setField("expiry_date", dateQueryString(product.expiration_date));
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
    [resetFields, setField, form, index],
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
    updatePackSize,
    updateTotalPurchasePrice,
    resetFields,
    markAsEdited,
    fillFromProduct,
    updateInformationalComponent,
  };
}
