import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Trash2 } from "lucide-react";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { cn } from "@/lib/utils";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Page from "@/components/Common/Page";
import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";
import {
  SupplyRequestCategory,
  SupplyRequestIntent,
  SupplyRequestPriority,
  SupplyRequestReason,
  SupplyRequestStatus,
} from "@/types/inventory/supplyRequest/supplyRequest";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";
import organizationApi from "@/types/organization/organizationApi";

const purchaseOrderSchema = z.object({
  status: z.nativeEnum(SupplyRequestStatus),
  intent: z.nativeEnum(SupplyRequestIntent),
  category: z.nativeEnum(SupplyRequestCategory),
  priority: z.nativeEnum(SupplyRequestPriority),
  reason: z.nativeEnum(SupplyRequestReason),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  deliver_from: z.string().optional(),
  deliver_to: z.string().min(1, "Delivery location is required"),
  item: z.string().min(1, "Item is required"),
});

const formSchema = z.object({
  requests: z
    .array(purchaseOrderSchema)
    .min(1, "At least one request is required"),
  supplier: z.string().min(1, "Vendor is required"),
});

interface Props {
  facilityId: string;
  locationId: string;
  productOrderId?: string;
}

export default function PurchaseOrderForm({
  facilityId,
  locationId,
  productOrderId,
}: Props) {
  const { t } = useTranslation();
  const isEditMode = Boolean(productOrderId);

  const { data: existingData, isFetching } = useQuery({
    queryKey: ["supplyRequest", productOrderId],
    queryFn: query(supplyRequestApi.retrieveSupplyRequest, {
      pathParams: { supplyRequestId: productOrderId! },
    }),
    enabled: isEditMode,
  });

  const title = isEditMode
    ? t("edit_purchase_order")
    : t("create_purchase_order");

  const queryClient = useQueryClient();
  const [searchItem, setSearchItem] = useState("");
  const [supplierSearchQuery, setSupplierSearchQuery] = useState("");

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["productKnowledge", facilityId, searchItem],
    queryFn: query.debounced(productKnowledgeApi.listProductKnowledge, {
      queryParams: {
        facility: facilityId,
        search: searchItem,
        status: "active",
      },
    }),
  });

  const productOptions =
    products?.results.map((product) => ({
      label: product.name,
      value: product.id,
    })) || [];

  const { data: availableSuppliers } = useQuery({
    queryKey: ["organizations", supplierSearchQuery],
    queryFn: query.debounced(organizationApi.list, {
      queryParams: {
        org_type: "product_supplier",
        name: supplierSearchQuery || undefined,
      },
    }),
  });

  const vendorOptions =
    availableSuppliers?.results.map((supplier) => ({
      label: supplier.name,
      value: supplier.id,
    })) || [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requests: [
        {
          status: SupplyRequestStatus.active,
          intent: SupplyRequestIntent.order,
          category: SupplyRequestCategory.nonstock,
          priority: SupplyRequestPriority.routine,
          reason: SupplyRequestReason.ward_stock,
          quantity: 1,
          deliver_to: locationId,
        },
      ],
      supplier: undefined,
    },
  });

  useEffect(() => {
    if (isEditMode && existingData) {
      form.reset({
        requests: [
          {
            status: existingData.status,
            intent: existingData.intent,
            category: existingData.category,
            priority: existingData.priority,
            reason: existingData.reason,
            quantity: existingData.quantity,
            deliver_from: existingData.deliver_from?.id,
            deliver_to: locationId,
            item: existingData.item.id,
          },
        ],
        supplier: existingData.supplier?.id,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, existingData]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "requests",
  });

  const { mutate: upsertSupplyRequest, isPending } = useMutation({
    mutationFn: mutate(supplyRequestApi.upsertSupplyRequest, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplyRequests"] });
      toast.success(
        isEditMode ? t("purchase_order_updated") : t("purchase_orders_created"),
      );
      navigate(
        `/facility/${facilityId}/locations/${locationId}/external_supply/purchase_orders`,
      );
    },
    onError: (error) => {
      const errorData = error.cause as {
        errors?: Array<{
          msg?: string;
          error?: string;
          type?: string;
          loc?: string[];
        }>;
        non_field_errors?: string[];
        detail?: string;
      };

      let errorDisplayed = false;

      if (errorData?.errors) {
        errorData.errors.forEach((error) => {
          const message = error.msg || error.error || t("validation_failed");
          toast.error(message);
          errorDisplayed = true;
        });
      }

      if (errorData?.non_field_errors) {
        errorData.non_field_errors.forEach((message) => {
          toast.error(message);
          errorDisplayed = true;
        });
      }

      if (errorData?.detail) {
        toast.error(errorData.detail);
        errorDisplayed = true;
      }

      if (!errorDisplayed) {
        toast.error(t("error_updating_supply_request"));
      }
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    upsertSupplyRequest({
      datapoints: data.requests.map((request) => ({
        ...request,
        id: productOrderId || undefined,
        supplier: data.supplier || undefined,
      })),
    });
  }

  if (isEditMode && isFetching) {
    return (
      <Page title={title} hideTitleOnPage>
        <div className="container mx-auto max-w-3xl">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          </div>
          <FormSkeleton rows={10} />
        </div>
      </Page>
    );
  }

  return (
    <Page title={title} hideTitleOnPage>
      <div className="container mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="p-2">
              <CardHeader className="pt-4 pb-1 px-2">
                <CardTitle>{t("request_details")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 bg-gray-50 m-2 p-2 rounded-md">
                <FormField
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("vendor")}</FormLabel>
                      <FormControl>
                        <Autocomplete
                          options={vendorOptions}
                          value={field.value || ""}
                          onChange={field.onChange}
                          isLoading={isLoadingProducts}
                          onSearch={setSupplierSearchQuery}
                          placeholder={t("select_vendor")}
                          inputPlaceholder={t("search_vendor")}
                          noOptionsMessage={t("no_vendor_found")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="requests.0.status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("status")}</FormLabel>
                        {isEditMode ? (
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
                              {Object.values(SupplyRequestStatus).map(
                                (status) => (
                                  <SelectItem key={status} value={status}>
                                    {t(status)}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        ) : (
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                              className="flex flex-col sm:flex-row gap-2"
                            >
                              {[
                                SupplyRequestStatus.active,
                                SupplyRequestStatus.draft,
                              ].map((status) => (
                                <div
                                  key={status}
                                  className={cn(
                                    "flex items-center space-x-2 rounded-md border border-gray-200 bg-white p-2",
                                    field.value === status &&
                                      "border-primary bg-primary/10",
                                  )}
                                >
                                  <RadioGroupItem value={status} id={status} />
                                  <Label htmlFor={status}>{t(status)}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </FormControl>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requests.0.priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("priority")}</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            className="flex flex-col sm:flex-row gap-2"
                          >
                            {Object.values(SupplyRequestPriority).map(
                              (priority) => (
                                <div
                                  key={priority}
                                  className={cn(
                                    "flex items-center space-x-2 rounded-md border border-gray-200 bg-white p-2",
                                    field.value === priority &&
                                      "border-primary bg-primary/10",
                                  )}
                                >
                                  <RadioGroupItem
                                    value={priority}
                                    id={priority}
                                  />
                                  <Label htmlFor={priority}>
                                    {t(priority)}
                                  </Label>
                                </div>
                              ),
                            )}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="p-2">
              <CardHeader className="pt-4 pb-1 px-2">
                <CardTitle>{t("items")}</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="rounded-md border border-gray-200 bg-gray-50 shadow">
                  <Table>
                    <TableHeader className="bg-gray-200/80">
                      <TableRow className="divide-x divide-gray-300">
                        <TableHead>{t("item")}</TableHead>
                        <TableHead>{t("quantity")}</TableHead>
                        {!isEditMode && (
                          <TableHead className="w-[100px]">
                            {t("actions")}
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow
                          key={field.id}
                          className="divide-x divide-gray-300"
                        >
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`requests.${index}.item`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Autocomplete
                                      options={productOptions}
                                      value={field.value || ""}
                                      onChange={field.onChange}
                                      isLoading={isLoadingProducts}
                                      onSearch={setSearchItem}
                                      placeholder={t("select_product")}
                                      inputPlaceholder={t("search_product")}
                                      noOptionsMessage={t("no_products_found")}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`requests.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={1}
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(parseInt(e.target.value))
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          {!isEditMode && (
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                disabled={fields.length === 1}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {!isEditMode && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      append({
                        status: form.getValues("requests.0.status"),
                        intent: form.getValues("requests.0.intent"),
                        category: form.getValues("requests.0.category"),
                        priority: form.getValues("requests.0.priority"),
                        reason: form.getValues("requests.0.reason"),
                        deliver_from: form.getValues("requests.0.deliver_from"),
                        deliver_to: locationId,
                        quantity: 1,
                        item: "",
                      })
                    }
                    className="mt-4"
                  >
                    <PlusCircle className="mr-2 size-4" />
                    {t("add_another_item")}
                  </Button>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    `/facility/${facilityId}/locations/${locationId}/external_supply/purchase_orders`,
                  )
                }
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEditMode
                    ? t("saving")
                    : t("creating")
                  : isEditMode
                    ? t("save")
                    : t("create")}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Page>
  );
}
