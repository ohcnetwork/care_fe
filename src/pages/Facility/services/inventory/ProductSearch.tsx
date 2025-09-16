import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";

import query from "@/Utils/request/query";
import { mergeAutocompleteOptions } from "@/Utils/utils";
import { ProductFormContent } from "@/pages/Facility/settings/product/ProductForm";
import {
  ProductRead,
  ProductStatusOptions,
} from "@/types/inventory/product/product";
import productApi from "@/types/inventory/product/productApi";

interface ProductSelectProps {
  facilityId: string;
  value?: ProductRead;
  onChange: (value: ProductRead | null) => void;
  disabled?: boolean;
  className?: string;
  onProductCreate?: (product: ProductRead) => void;
  productKnowledgeSlug?: string;
  enabled?: boolean;
  ref?: React.RefObject<{
    createNewProduct: () => void;
  }>;
}

export function ProductSearch({
  value,
  facilityId,
  onChange,
  disabled,
  onProductCreate,
  productKnowledgeSlug,
  enabled = true,
  ref,
}: ProductSelectProps) {
  const { t } = useTranslation();

  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<
    ProductRead | undefined
  >();

  const { data: products, isFetching: isProductsFetching } = useQuery({
    queryKey: ["products", productKnowledgeSlug],
    queryFn: query(productApi.listProduct, {
      pathParams: { facilityId },
      queryParams: {
        status: ProductStatusOptions.active,
        product_knowledge: productKnowledgeSlug,
      },
    }),
    enabled,
  });

  useEffect(() => {
    if (selectedProduct) {
      setIsCreatingProduct(false);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (value) {
      setSelectedProduct(value);
      setIsCreatingProduct(false);
    } else {
      setSelectedProduct(undefined);
    }
  }, [value]);

  const options = mergeAutocompleteOptions(
    products?.results.map((product: ProductRead) => ({
      label:
        (product.batch?.lot_number
          ? `${t("lot")}: ${product.batch.lot_number}`
          : "") +
        (product.expiration_date
          ? ` | ${t("expires")}: ${new Date(product.expiration_date).toLocaleDateString()}`
          : ""),
      value: product.id,
    })) || [],
    value
      ? {
          label:
            (value.batch?.lot_number
              ? ` ${t("lot")}: ${value.batch.lot_number}`
              : "") +
            (value.expiration_date
              ? ` | ${t("expires")}: ${new Date(value.expiration_date).toLocaleDateString()}`
              : ""),
          value: value.id,
        }
      : undefined,
  );

  // Add the "create new product" option as the last item
  options.push({
    label: t("create_new_product_instead"),
    value: "new",
  });

  return (
    <div className="bg-gray-100 p-3 rounded flex flex-col gap-2">
      <Autocomplete
        value={selectedProduct?.id || ""}
        onChange={(selectedId) => {
          if (selectedId === "new") {
            setSelectedProduct(undefined);
            setIsCreatingProduct(true);
            onChange(null);
            return;
          }
          const selectedProductObj = products?.results.find(
            (p: ProductRead) => p.id === selectedId,
          );
          if (selectedProductObj) {
            onChange(selectedProductObj);
            setSelectedProduct(selectedProductObj);
          } else {
            onChange({} as any);
            setSelectedProduct(undefined);
          }
        }}
        options={options}
        isLoading={isProductsFetching}
        placeholder={t("select_product")}
        noOptionsMessage={t("no_products_found")}
        disabled={disabled}
        className="w-full md:w-[350px]"
        closeOnSelect
      />
      {isCreatingProduct && (
        <ProductFormContent
          facilityId={facilityId}
          slug={productKnowledgeSlug}
          onSuccess={(product) => {
            onChange(product);
            setSelectedProduct(product);
            onProductCreate?.(product);
          }}
          onCancel={() => {
            setIsCreatingProduct(false);
            setSelectedProduct(undefined);
          }}
          disableButtons
          enabled={enabled && isCreatingProduct}
          ref={ref}
        />
      )}
    </div>
  );
}
