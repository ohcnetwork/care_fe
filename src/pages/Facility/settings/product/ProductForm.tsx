import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
  SheetTrigger,
} from "@/components/ui/sheet";

import Page from "@/components/Common/Page";
import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { mergeAutocompleteOptions } from "@/Utils/utils";
import { ProductKnowledgeSelect } from "@/pages/Facility/services/inventory/ProductKnowledgeSelect";
import { ChargeItemDefinitionForm } from "@/pages/Facility/settings/chargeItemDefinitions/ChargeItemDefinitionForm";
import {
  ChargeItemDefinitionRead,
  ChargeItemDefinitionStatus,
} from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";
import {
  ProductCreate,
  ProductRead,
  ProductStatusOptions,
  ProductUpdate,
} from "@/types/inventory/product/product";
import productApi from "@/types/inventory/product/productApi";
import {
  ProductKnowledgeBase,
  ProductKnowledgeStatus,
} from "@/types/inventory/productKnowledge/productKnowledge";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";

const formSchema = z.object({
  status: z.nativeEnum(ProductStatusOptions),
  product_knowledge: z.string().min(1, "Product Knowledge is required"),
  charge_item_definition: z.string().optional(),
  batch: z
    .object({
      lot_number: z.string().optional(),
    })
    .required(),
  expiration_date: z.date(),
});

export default function ProductForm({
  facilityId,
  productId,
  onSuccess,
}: {
  facilityId: string;
  productId?: string;
  onSuccess?: (product: ProductRead) => void;
}) {
  const { t } = useTranslation();

  const isEditMode = Boolean(productId);

  const { data: existingData, isFetching } = useQuery({
    queryKey: ["product", productId],
    queryFn: query(productApi.retrieveProduct, {
      pathParams: {
        facilityId,
        productId: productId!,
      },
    }),
    enabled: isEditMode,
  });

  if (isEditMode && isFetching) {
    return (
      <Page title={t("edit_product")} hideTitleOnPage>
        <div className="container mx-auto max-w-3xl">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("edit_product")}
            </h1>
          </div>
          <FormSkeleton rows={6} />
        </div>
      </Page>
    );
  }

  return (
    <Page
      title={isEditMode ? t("edit_product") : t("create_product")}
      hideTitleOnPage
    >
      <div className="container mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">
            {isEditMode ? t("edit_product") : t("create_product")}
          </h1>
          {isEditMode && (
            <p className="text-sm text-gray-500">
              {t("edit_product_description")}
            </p>
          )}
        </div>
        <ProductFormContent
          facilityId={facilityId}
          productId={productId}
          existingData={existingData}
          onSuccess={onSuccess}
          containerClassName="rounded-lg border border-gray-200 bg-white p-6"
        />
      </div>
    </Page>
  );
}

export function ProductFormContent({
  facilityId,
  productId,
  existingData,
  productKnowledgeId,
  containerClassName,
  onSuccess = () => navigate(`/facility/${facilityId}/settings/product`),
  onCancel = () => navigate(`/facility/${facilityId}/settings/product`),
  disableButtons = false,
  externalSubmitRef,
  enabled = true,
}: {
  facilityId: string;
  productId?: string;
  existingData?: ProductRead;
  productKnowledgeId?: string;
  containerClassName?: string;
  onSuccess?: (product: ProductRead) => void;
  onCancel?: () => void;
  disableButtons?: boolean;
  externalSubmitRef?: React.RefObject<(() => void) | null>;
  enabled?: boolean;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(productId);
  const [cidSearch, setCidSearch] = useState("");
  const [createCidOpen, setCreateCidOpen] = useState(false);

  // Get product knowledge list for the dropdown
  const { data: productKnowledgeResponse } = useQuery({
    queryKey: ["productKnowledge"],
    queryFn: query(productKnowledgeApi.listProductKnowledge, {
      queryParams: {
        facility: facilityId,
        limit: 100,
        status: ProductKnowledgeStatus.active,
      },
    }),
    enabled,
  });

  const { data: existingProductKnowledge } = useQuery({
    queryKey: ["productKnowledge", productKnowledgeId],
    queryFn: query(productKnowledgeApi.retrieveProductKnowledge, {
      pathParams: {
        productKnowledgeId: productKnowledgeId!,
      },
    }),
    enabled: !!productKnowledgeId && enabled,
  });

  // Add selected product knowledge to the product knowledge list if it's not already there
  const productKnowledgeData: ProductKnowledgeBase[] =
    productKnowledgeResponse?.results.find(
      (pk) => pk.id === existingProductKnowledge?.id,
    )
      ? productKnowledgeResponse?.results
      : [
          ...(productKnowledgeResponse?.results || []),
          ...(existingProductKnowledge ? [existingProductKnowledge] : []),
        ];

  // Get charge item definition list for the dropdown with search
  const { data: chargeItemDefinitionResponse, isLoading: isLoadingCID } =
    useQuery({
      queryKey: ["chargeItemDefinitions", cidSearch],
      queryFn: query.debounced(
        chargeItemDefinitionApi.listChargeItemDefinition,
        {
          pathParams: { facilityId },
          queryParams: {
            limit: 100,
            status: ChargeItemDefinitionStatus.active,
            title: cidSearch,
          },
        },
      ),
    });

  const chargeItemDefinitionOptions =
    chargeItemDefinitionResponse?.results || [];

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues:
      isEditMode && existingData
        ? {
            status: existingData.status,
            product_knowledge: existingData.product_knowledge.id,
            charge_item_definition: existingData.charge_item_definition?.id,
            batch: existingData.batch || undefined,
            expiration_date: existingData.expiration_date
              ? new Date(existingData.expiration_date)
              : undefined,
          }
        : {
            status: ProductStatusOptions.active,
            product_knowledge: productKnowledgeId,
          },
  });

  const { mutate: createProduct, isPending: isCreating } = useMutation({
    mutationFn: mutate(productApi.createProduct, {
      pathParams: { facilityId },
    }),
    onSuccess: (product: ProductRead) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(t("product_created_successfully"));
      onSuccess?.(product);
    },
  });

  const { mutate: updateProduct, isPending: isUpdating } = useMutation({
    mutationFn: mutate(productApi.updateProduct, {
      pathParams: {
        facilityId,
        productId: productId || "",
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({
        queryKey: ["product", productId],
      });
      toast.success(t("product_updated_successfully"));
      navigate(`/facility/${facilityId}/settings/product`);
    },
  });

  const isPending = isCreating || isUpdating;
  function onSubmit(data: z.infer<typeof formSchema>) {
    // Format the data for API submission
    const formattedData = {
      ...data,
      expiration_date: data.expiration_date
        ? format(data.expiration_date, "yyyy-MM-dd")
        : undefined,
    };

    if (isEditMode && productId) {
      const updatePayload: ProductUpdate = {
        id: productId,
        status: formattedData.status,
        batch: formattedData.batch,
        expiration_date: formattedData.expiration_date,
        charge_item_definition: formattedData.charge_item_definition,
        product_knowledge: formattedData.product_knowledge,
      };
      updateProduct(updatePayload);
    } else {
      const createPayload: ProductCreate = {
        status: formattedData.status,
        batch: formattedData.batch,
        expiration_date: formattedData.expiration_date,
        product_knowledge: formattedData.product_knowledge,
        charge_item_definition: formattedData.charge_item_definition,
      };
      createProduct(createPayload);
    }
  }

  useEffect(() => {
    if (externalSubmitRef) {
      externalSubmitRef.current = () => {
        form.handleSubmit(onSubmit)();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalSubmitRef]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className={containerClassName}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("status")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_status")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(ProductStatusOptions).map((status) => (
                        <SelectItem key={status} value={status}>
                          {t(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditMode && !existingProductKnowledge && (
              <FormField
                control={form.control}
                name="product_knowledge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel aria-required>
                      {t("product_knowledge")}
                    </FormLabel>
                    <FormControl>
                      <ProductKnowledgeSelect
                        value={productKnowledgeData?.find(
                          (pk) => pk.id === field.value,
                        )}
                        onChange={(selected) => field.onChange(selected.id)}
                        className="border-gray-200 font-normal text-gray-700"
                      />
                    </FormControl>
                    <FormDescription>
                      {t("product_knowledge_selection_description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="batch.lot_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel aria-required>{t("lot_number")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("enter_lot_number")}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("lot_number_description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiration_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel aria-required>{t("expiration_date")}</FormLabel>
                  <DatePicker
                    date={field.value}
                    onChange={field.onChange}
                    className="w-full"
                  />
                  <FormDescription>
                    {t("expiration_date_description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              {t("billing_information")}
            </h2>
            <p className="text-sm text-gray-500">
              {t("product_charge_item_definition_selection_description")}
            </p>
          </div>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="charge_item_definition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("charge_item_definition")}</FormLabel>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <FormControl className="flex-1">
                      <Autocomplete
                        options={mergeAutocompleteOptions(
                          chargeItemDefinitionOptions.map((cid) => ({
                            label: cid.title,
                            value: cid.id,
                          })),
                          field.value
                            ? {
                                label:
                                  chargeItemDefinitionOptions.find(
                                    (cid) => cid.id === field.value,
                                  )?.title || "",
                                value: field.value,
                              }
                            : undefined,
                        )}
                        value={field.value || ""}
                        onChange={field.onChange}
                        onSearch={setCidSearch}
                        placeholder={t("select_charge_item_definition")}
                        isLoading={isLoadingCID}
                        noOptionsMessage={t("no_charge_item_definitions_found")}
                        data-cy="charge-item-definition-search"
                      />
                    </FormControl>
                    <Sheet open={createCidOpen} onOpenChange={setCreateCidOpen}>
                      <SheetTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full sm:w-auto"
                        >
                          {t("create_new")}
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-[90%] sm:max-w-2xl flex min-w-full flex-col bg-gray-100 sm:min-w-fit overflow-y-auto">
                        <SheetHeader>
                          <SheetTitle>
                            {t("create_charge_item_definition")}
                          </SheetTitle>
                          <SheetDescription>
                            {t("create_charge_item_definition_description")}
                          </SheetDescription>
                        </SheetHeader>
                        <div className="mt-6">
                          <ChargeItemDefinitionForm
                            facilityId={facilityId}
                            onSuccess={(
                              chargeItemDefinition: ChargeItemDefinitionRead,
                            ) => {
                              queryClient.invalidateQueries({
                                queryKey: ["chargeItemDefinitions"],
                              });
                              setCreateCidOpen(false);
                              form.setValue(
                                "charge_item_definition",
                                chargeItemDefinition.id,
                              );
                            }}
                            onCancel={() => setCreateCidOpen(false)}
                          />
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {!disableButtons && (
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("saving") : isEditMode ? t("update") : t("create")}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
