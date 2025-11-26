import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { useCallback, useEffect } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";

import { SupplyDeliveryFormValues } from "@/pages/Facility/services/inventory/externalSupply/deliveryOrder/AddSupplyDeliveryForm";
import { ProductKnowledgeSelect } from "@/pages/Facility/services/inventory/ProductKnowledgeSelect";
import ProductSelect from "@/pages/Facility/services/inventory/ProductSelect";
import { ProductRead } from "@/types/inventory/product/product";
import productApi from "@/types/inventory/product/productApi";
import query from "@/Utils/request/query";

interface Props {
  form: UseFormReturn<SupplyDeliveryFormValues>;
  index: number;
  facilityId: string;
  onRemove: () => void;
  canRemove: boolean;
}

export function ExternalDeliveryRow({
  form,
  index,
  facilityId,
  onRemove,
  canRemove,
}: Props) {
  const { t } = useTranslation();

  const productKnowledge = useWatch({
    control: form.control,
    name: `items.${index}.product_knowledge`,
  });

  const suppliedItem = useWatch({
    control: form.control,
    name: `items.${index}.supplied_item`,
  });

  // Fetch last product when PK is selected (and no product is selected yet)
  const { data: lastProductResponse } = useQuery({
    queryKey: ["lastProduct", facilityId, productKnowledge?.slug],
    queryFn: query(productApi.listProduct, {
      pathParams: { facilityId },
      queryParams: {
        product_knowledge: productKnowledge?.slug,
        ordering: "-created_date",
        limit: 1,
      },
    }),
    enabled: !!productKnowledge?.slug && !suppliedItem,
  });

  const fillFormFromProduct = useCallback(
    (product: ProductRead) => {
      form.setValue(`items.${index}.supplied_item`, product);
      if (product.batch?.lot_number) {
        form.setValue(`items.${index}.batch_number`, product.batch.lot_number);
      }
      if (product.expiration_date) {
        form.setValue(
          `items.${index}.expiry_date`,
          format(new Date(product.expiration_date), "yyyy-MM-dd"),
        );
      }
      if (product.charge_item_definition) {
        form.setValue(
          `items.${index}.charge_item_definition`,
          product.charge_item_definition,
        );
        const price =
          product.charge_item_definition.price_components?.[0]?.amount;
        if (price) {
          form.setValue(`items.${index}.unit_price`, parseFloat(price));
        }
      } else {
        // Default price to 0 if no charge item
        form.setValue(`items.${index}.unit_price`, 0);
      }
      // Mark as not manually edited so we know it's clean
      form.setValue(`items.${index}.is_manually_edited`, false);
    },
    [form, index],
  );

  // Auto-fill from last product
  useEffect(() => {
    if (
      lastProductResponse?.results?.length &&
      !suppliedItem &&
      !form.getValues(`items.${index}.is_manually_edited`)
    ) {
      const lastProduct = lastProductResponse.results[0];
      fillFormFromProduct(lastProduct);
    }
  }, [lastProductResponse, suppliedItem, fillFormFromProduct, form, index]);

  const handleProductSelect = (product: ProductRead) => {
    fillFormFromProduct(product);
    // When manually selecting a product, we consider it a clean state from that product
    form.setValue(`items.${index}.is_manually_edited`, false);
  };

  const markAsEdited = () => {
    form.setValue(`items.${index}.is_manually_edited`, true);
    // We clear supplied_item to decouple
    form.setValue(`items.${index}.supplied_item`, undefined);
  };

  return (
    <TableRow className="divide-x divide-gray-300">
      {/* Product Knowledge */}
      <TableCell className="align-top min-w-[200px]">
        <FormField
          control={form.control}
          name={`items.${index}.product_knowledge`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <ProductKnowledgeSelect
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                    // Clear other fields when PK changes
                    form.setValue(`items.${index}.supplied_item`, undefined);
                    form.setValue(`items.${index}.batch_number`, "");
                    form.setValue(`items.${index}.expiry_date`, "");
                    form.setValue(
                      `items.${index}.charge_item_definition`,
                      undefined,
                    );
                    form.setValue(`items.${index}.unit_price`, 0);
                    form.setValue(`items.${index}.is_manually_edited`, false);
                  }}
                  placeholder={t("select_product")}
                  className="w-full"
                  disableFavorites
                  hideClearButton
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>

      {/* Product Select (Search/Auto-fill) */}
      <TableCell className="align-top min-w-[200px]">
        <ProductSelect
          facilityId={facilityId}
          productKnowledgeSlug={productKnowledge?.slug}
          receivingItem={productKnowledge?.name}
          quantity={form
            .watch(`items.${index}.supplied_item_quantity`)
            ?.toString()}
          onSelect={handleProductSelect}
          selectedProduct={suppliedItem}
          disabled={!productKnowledge}
        />
      </TableCell>

      {/* Batch Number */}
      <TableCell className="align-top w-[120px]">
        <FormField
          control={form.control}
          name={`items.${index}.batch_number`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("batch")}
                  onChange={(e) => {
                    field.onChange(e);
                    markAsEdited();
                  }}
                  disabled={!productKnowledge}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>

      {/* Expiry Date */}
      <TableCell className="align-top w-[150px]">
        <FormField
          control={form.control}
          name={`items.${index}.expiry_date`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  type="date"
                  onChange={(e) => {
                    field.onChange(e);
                    markAsEdited();
                  }}
                  disabled={!productKnowledge}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>

      {/* Quantity */}
      <TableCell className="align-top w-[100px]">
        <FormField
          control={form.control}
          name={`items.${index}.supplied_item_quantity`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>

      {/* Unit Price */}
      <TableCell className="align-top w-[150px]">
        <FormField
          control={form.control}
          name={`items.${index}.unit_price`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  {...field}
                  placeholder={t("price")}
                  onChange={(e) => {
                    field.onChange(parseFloat(e.target.value));
                    markAsEdited();
                  }}
                  disabled={!productKnowledge}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>

      {/* Remove */}
      <TableCell className="align-top w-[50px]">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={!canRemove}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
