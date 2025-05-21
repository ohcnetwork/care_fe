import { useQuery } from "@tanstack/react-query";
import { BoxIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import query from "@/Utils/request/query";
import { ProductFormContent } from "@/pages/Facility/settings/product/ProductForm";
import {
  ProductRead,
  ProductStatusOptions,
} from "@/types/inventory/product/product";
import productApi from "@/types/inventory/product/productApi";
import {
  ProductKnowledgeBase,
  ProductKnowledgeStatus,
} from "@/types/inventory/productKnowledge/productKnowledge";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";

interface ProductSelectProps {
  facilityId: string;
  value?: ProductRead;
  onChange: (value: ProductRead) => void;
  disabled?: boolean;
  className?: string;
}

export function ProductSearch({
  facilityId,
  onChange,
  disabled,
  className,
}: ProductSelectProps) {
  const { t } = useTranslation();

  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [productKnowledge, setProductKnowledge] =
    useState<ProductKnowledgeBase>();

  const { data: productKnowledges, isLoading: isProductKnowledgeLoading } =
    useQuery({
      queryKey: ["productKnowledge"],
      queryFn: query(productKnowledgeApi.listProductKnowledge, {
        queryParams: {
          facility: facilityId,
          limit: 100,
          status: ProductKnowledgeStatus.active,
        },
      }),
    });

  const { data: products, isFetching: isProductsFetching } = useQuery({
    queryKey: ["products", productKnowledge?.id],
    queryFn: query(productApi.listProduct, {
      pathParams: { facilityId },
      queryParams: {
        status: ProductStatusOptions.active,
        product_knowledge: productKnowledge?.id,
      },
    }),
    enabled: !!productKnowledge?.id,
  });

  const productKnowledgeOptions =
    productKnowledges?.results.map((productKnowledge) => ({
      label: productKnowledge.name,
      value: productKnowledge.id,
    })) || [];

  return (
    <>
      <div className="flex-1">
        <Autocomplete
          value={productKnowledge?.id || ""}
          onChange={(selectedId) => {
            setProductKnowledge(
              productKnowledges?.results.find((p) => p.id === selectedId),
            );
          }}
          options={productKnowledgeOptions}
          isLoading={isProductKnowledgeLoading}
          placeholder={t("search_product_knowledge")}
          noOptionsMessage={t("no_product_knowledge_found")}
          disabled={disabled}
          className={className}
          closeOnSelect
        />
      </div>

      <div className="flex-1">
        <Select
          value=""
          onValueChange={(selectedId) => {
            if (selectedId === "new") {
              setIsCreatingProduct(true);
              return;
            }

            const selectedProduct = products?.results.find(
              (p) => p.id === selectedId,
            );
            if (selectedProduct) {
              onChange(selectedProduct);
              setProductKnowledge(undefined);
            }
          }}
          disabled={disabled || !productKnowledge || isProductsFetching}
        >
          <SelectTrigger className="w-full md:w-[350px]">
            <SelectValue placeholder={t("select_product")} />
          </SelectTrigger>
          <SelectContent>
            {products?.results.map((product) => (
              <SelectItem
                key={product.id}
                value={product.id}
                className="flex items-center"
              >
                <BoxIcon className="size-4 mr-2" />
                {product.batch?.lot_number && (
                  <span>{`${t("lot")}: ${product.batch.lot_number}`}</span>
                )}
                {product.expiration_date && (
                  <span className="ml-auto">
                    {t("expires")}:{" "}
                    {new Date(product.expiration_date).toLocaleDateString()}
                  </span>
                )}
              </SelectItem>
            ))}
            <SelectItem value="new">
              <span className="text-sm flex items-center">
                <PlusIcon className="size-4 mr-2" />
                {t("create_new_product_instead")}
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Sheet open={isCreatingProduct} onOpenChange={setIsCreatingProduct}>
        <SheetContent className="w-full sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>{t("create_product")}</SheetTitle>
            <SheetDescription>
              {t("create_product_description")}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
            <ProductFormContent
              facilityId={facilityId}
              productKnowledgeId={productKnowledge?.id}
              onSuccess={(product) => {
                setIsCreatingProduct(false);
                onChange(product);
              }}
            />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
