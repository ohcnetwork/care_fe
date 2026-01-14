import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
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
import { ProductRead } from "@/types/inventory/product/product";
import productApi from "@/types/inventory/product/productApi";
import query from "@/Utils/request/query";

import {
  SupplyDeliveryFormValues,
  SupplyDeliveryItemValues,
} from "./AddSupplyDeliveryForm";

type ItemPath = `items.${number}.${keyof SupplyDeliveryItemValues}`;

interface UseDeliveryRowItemProps {
  form: UseFormReturn<SupplyDeliveryFormValues>;
  index: number;
}

/**
 * Custom hook that manages all state and logic for a delivery row item.
 * Consolidates multiple useWatch calls and provides clean APIs for mutations.
 */
export function useDeliveryRowItem({ form, index }: UseDeliveryRowItemProps) {
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
    supplied_item_quantity: quantity = 1,
    supplied_item_pack_quantity: packQuantity,
    supplied_item_pack_size: packSize,
    tax_components: taxComponents,
    discount_components: discountComponents,
    informational_components: informationalComponents,
    charge_item_category: chargeItemCategory,
    is_tax_inclusive: isTaxInclusive,
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
      unit_price: 0,
      informational_components: [],
      tax_components: [],
      discount_components: [],
      charge_item_category: undefined,
      is_manually_edited: false,
      supplied_item_pack_quantity: 1,
      supplied_item_pack_size: 1,
    };

    Object.entries(fieldsToReset).forEach(([field, value]) => {
      setField(field as keyof SupplyDeliveryItemValues, value);
    });
    setIsCreatingNew(false);
  }, [setField]);

  // Mark item as manually edited (creating new product)
  const markAsEdited = useCallback(() => {
    setField("is_manually_edited", true);
    setField("supplied_item", undefined);
    setIsCreatingNew(true);
  }, [setField]);

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

  // Fill form from existing product
  const fillFromProduct = useCallback(
    (product: ProductRead) => {
      setField("supplied_item", product);

      if (product.batch?.lot_number) {
        setField("batch_number", product.batch.lot_number);
      }
      if (product.expiration_date) {
        setField(
          "expiry_date",
          format(new Date(product.expiration_date), "yyyy-MM-dd"),
        );
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
          setField("unit_price", parseFloat(baseComponents[0].amount));
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
      } else {
        setField("unit_price", 0);
      }

      setField("is_manually_edited", false);
      setIsCreatingNew(false);
    },
    [setField],
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
    if (suppliedItem?.charge_item_definition?.category) return false;
    return isCreatingNew || products.length === 0;
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

  // Total tax factor for tax-inclusive calculation
  const totalTaxFactor = useMemo(() => {
    if (!taxComponents?.length) return 0;
    return taxComponents.reduce((sum, tax) => sum + (tax.factor || 0), 0);
  }, [taxComponents]);

  // Calculate base price from MRP when tax inclusive is enabled
  useEffect(() => {
    if (isTaxInclusive && mrpValue > 0) {
      let calculatedBasePrice = mrpValue / (1 + totalTaxFactor / 100);
      if (packSize && packQuantity && packSize > 0)
        calculatedBasePrice = calculatedBasePrice / packSize;
      const roundedBasePrice = Math.round(calculatedBasePrice * 100) / 100;
      setField("unit_price", roundedBasePrice);
    }
  }, [isTaxInclusive, mrpValue, totalTaxFactor, packSize, setField]);

  // Auto-calculate quantity when pack quantity or pack size changes
  useEffect(() => {
    if (packQuantity && packSize && packQuantity > 0 && packSize > 0) {
      const calculatedQuantity = packQuantity * packSize;
      setField("supplied_item_quantity", calculatedQuantity);
    }
  }, [packQuantity, packSize, setField]);

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
      markAsEdited();
    },
    [informationalComponents, setField, markAsEdited],
  );

  return {
    // Item values
    productKnowledge,
    suppliedItem,
    batchNumber,
    unitPrice,
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
    products,
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
