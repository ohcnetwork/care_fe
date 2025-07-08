import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Trash2, X } from "lucide-react";
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

import useAppHistory from "@/hooks/useAppHistory";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";
import {
  SupplyRequestCategory,
  SupplyRequestIntent,
  SupplyRequestPriority,
  SupplyRequestReason,
  SupplyRequestStatus,
} from "@/types/inventory/supplyRequest/supplyRequest";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";
import { LocationList } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";
import organizationApi from "@/types/organization/organizationApi";

const supplyRequestItemSchema = z.object({
  item: z.string().min(1, "Item is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

const createFormSchema = (mode: "external" | "internal") =>
  z.object({
    status: z.nativeEnum(SupplyRequestStatus),
    intent: z.nativeEnum(SupplyRequestIntent),
    category: z.nativeEnum(SupplyRequestCategory),
    priority: z.nativeEnum(SupplyRequestPriority),
    reason: z.nativeEnum(SupplyRequestReason),
    deliver_from:
      mode === "internal"
        ? z.string().min(1, "Please select a location to deliver from")
        : z.string().optional(),
    deliver_to: z.string(),
    requests: z
      .array(supplyRequestItemSchema)
      .min(1, "At least one request is required"),
    supplier:
      mode === "external"
        ? z.string().min(1, "Vendor is required")
        : z.string().optional(),
  });

interface Props {
  facilityId: string;
  locationId: string;
  supplyRequestId?: string;
  mode: "external" | "internal";
}

export default function SupplyRequestForm({
  facilityId,
  locationId,
  supplyRequestId,
  mode,
}: Props) {
  const { t } = useTranslation();
  const { goBack } = useAppHistory();
  const isEditMode = Boolean(supplyRequestId);

  const isExternalMode = mode === "external";

  const { data: existingData, isFetching } = useQuery({
    queryKey: ["supplyRequest", supplyRequestId],
    queryFn: query(supplyRequestApi.retrieveSupplyRequest, {
      pathParams: { supplyRequestId: supplyRequestId! },
    }),
    enabled: isEditMode,
  });

  const title = isEditMode
    ? isExternalMode
      ? t("edit_purchase_order")
      : t("edit_stock_request")
    : isExternalMode
      ? t("create_purchase_order")
      : t("raise_stock_request");

  const pageDescription = isExternalMode
    ? t("request_stock_from_vendor")
    : t("request_stock_from_another_store_or_pharmacy_within_the_facility");

  const returnPath = isExternalMode
    ? `/facility/${facilityId}/locations/${locationId}/external_supply/purchase_orders`
    : `/facility/${facilityId}/locations/${locationId}/internal_transfers/to_receive`;

  const queryClient = useQueryClient();
  const [searchItem, setSearchItem] = useState("");
  const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
  const [searchDeliveryFrom, setSearchDeliveryFrom] = useState("");

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

  const {
    data: deliveryFromLocations,
    isLoading: isLoadingDeliveryFromLocations,
  } = useQuery({
    queryKey: ["locations", facilityId, searchDeliveryFrom],
    queryFn: query.debounced(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        search: searchDeliveryFrom,
        limit: 100,
        mode: "kind",
        ordering: "sort_index",
      },
    }),
    select: (data: PaginatedResponse<LocationList>) => {
      // Filter out the current location
      return data.results.filter((location) => location.id !== locationId);
    },
  });

  const vendorOptions =
    availableSuppliers?.results.map((supplier) => ({
      label: supplier.name,
      value: supplier.id,
    })) || [];

  const deliveryFromOptions =
    deliveryFromLocations?.map((location) => ({
      label: location.name,
      value: location.id,
    })) || [];

  const formSchema = createFormSchema(mode);
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: SupplyRequestStatus.active,
      intent: SupplyRequestIntent.order,
      category: isExternalMode
        ? SupplyRequestCategory.nonstock
        : SupplyRequestCategory.central,
      priority: SupplyRequestPriority.routine,
      reason: SupplyRequestReason.ward_stock,
      deliver_to: locationId,
      deliver_from: "",
      requests: [
        {
          quantity: 1,
          item: "",
        },
      ],
      supplier: "",
    },
  });

  useEffect(() => {
    if (isEditMode && existingData) {
      form.reset({
        status: existingData.status,
        intent: existingData.intent,
        category: existingData.category,
        priority: existingData.priority,
        reason: existingData.reason,
        deliver_from: existingData.deliver_from?.id || "",
        deliver_to: locationId,
        requests: [
          {
            quantity: existingData.quantity,
            item: existingData.item.id,
          },
        ],
        supplier: existingData.supplier?.id || "",
      });
    }
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
      navigate(returnPath);
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

  function onSubmit(data: FormValues) {
    upsertSupplyRequest({
      datapoints: data.requests.map((request) => ({
        status: data.status,
        intent: data.intent,
        category: data.category,
        priority: data.priority,
        reason: data.reason,
        deliver_from: data.deliver_from || undefined,
        deliver_to: data.deliver_to,
        quantity: request.quantity,
        item: request.item,
        id: supplyRequestId || undefined,
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
        <div className="mb-6 relative">
          <Button
            variant="outline"
            size="icon"
            className="absolute -right-2 -top-2"
            onClick={() => goBack()}
          >
            <X className="size-5" />
            <span className="sr-only">{t("close")}</span>
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-600">{pageDescription}</p>
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
                  name={isExternalMode ? "supplier" : "deliver_from"}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {isExternalMode ? t("vendor") : t("deliver_from")}
                      </FormLabel>
                      <FormControl>
                        <Autocomplete
                          options={
                            isExternalMode ? vendorOptions : deliveryFromOptions
                          }
                          value={field.value || ""}
                          onChange={field.onChange}
                          isLoading={
                            isExternalMode
                              ? isLoadingProducts
                              : isLoadingDeliveryFromLocations
                          }
                          onSearch={
                            isExternalMode
                              ? setSupplierSearchQuery
                              : setSearchDeliveryFrom
                          }
                          placeholder={
                            isExternalMode
                              ? t("select_vendor")
                              : t("select_location")
                          }
                          inputPlaceholder={
                            isExternalMode
                              ? t("search_vendor")
                              : t("search_location")
                          }
                          noOptionsMessage={
                            isExternalMode
                              ? t("no_vendor_found")
                              : t("no_location_found")
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
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
                    name="priority"
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

                {!isExternalMode && (
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("reason")}</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            className="flex flex-col sm:flex-row gap-2"
                          >
                            {Object.values(SupplyRequestReason).map(
                              (reason) => (
                                <div
                                  key={reason}
                                  className={cn(
                                    "flex items-center space-x-2 rounded-md border border-gray-200 bg-white p-2",
                                    field.value === reason &&
                                      "border-primary bg-primary/10",
                                  )}
                                >
                                  <RadioGroupItem value={reason} id={reason} />
                                  <Label htmlFor={reason}>{t(reason)}</Label>
                                </div>
                              ),
                            )}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
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
                          <TableCell className="align-top">
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
                          <TableCell className="align-top">
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
                            <TableCell className="align-top">
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

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    append({
                      quantity: 1,
                      item: "",
                    })
                  }
                  className="mt-4"
                >
                  <PlusCircle className="mr-2 size-4" />
                  {t("add_another_item")}
                </Button>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => navigate(returnPath)}>
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
