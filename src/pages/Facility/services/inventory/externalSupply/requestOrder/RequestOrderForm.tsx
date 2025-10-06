import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";

import Page from "@/components/Common/Page";
import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import useAppHistory from "@/hooks/useAppHistory";

import Autocomplete from "@/components/ui/autocomplete";
import { getInventoryBasePath } from "@/pages/Facility/services/inventory/externalSupply/utils/inventoryUtils";
import {
  RequestOrderCategory,
  RequestOrderIntent,
  RequestOrderPriority,
  RequestOrderReason,
  RequestOrderRetrieve,
  RequestOrderStatus,
} from "@/types/inventory/requestOrder/requestOrder";
import requestOrderApi from "@/types/inventory/requestOrder/requestOrderApi";
import { LocationList } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";
import organizationApi from "@/types/organization/organizationApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";

const createRequestOrderFormSchema = (
  t: (key: string) => string,
  internal: boolean,
) =>
  z.object({
    status: z.nativeEnum(RequestOrderStatus),
    name: z.string().min(1, t("name_is_required")),
    note: z.string().optional(),
    intent: z.nativeEnum(RequestOrderIntent),
    category: z.nativeEnum(RequestOrderCategory),
    priority: z.nativeEnum(RequestOrderPriority),
    reason: z.nativeEnum(RequestOrderReason),
    supplier: internal
      ? z.string().optional()
      : z.string().min(1, t("supplier_required")),
    origin: internal
      ? z.string().min(1, t("origin_required"))
      : z.string().optional(),
    destination: z.string().min(1, t("destination_required")),
  });

type FormValues = z.infer<ReturnType<typeof createRequestOrderFormSchema>>;

interface Props {
  facilityId: string;
  locationId: string;
  internal: boolean;
  requestOrderId?: string;
}

export default function RequestOrderForm({
  facilityId,
  locationId,
  internal,
  requestOrderId,
}: Props) {
  const { t } = useTranslation();
  const { goBack } = useAppHistory();
  const isEditMode = Boolean(requestOrderId);

  const { data: existingData, isFetching } = useQuery({
    queryKey: ["requestOrder", requestOrderId],
    queryFn: query(requestOrderApi.retrieveRequestOrder, {
      pathParams: {
        facilityId: facilityId,
        requestOrderId: requestOrderId!,
      },
    }),
    enabled: isEditMode,
  });

  const title = isEditMode ? t("edit_order") : t("create_order");

  const returnPath = getInventoryBasePath(
    facilityId,
    locationId,
    internal,
    true,
    true,
  );

  const queryClient = useQueryClient();
  const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
  const [searchDeliveryFrom, setSearchDeliveryFrom] = useState("");

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

  const form = useForm<FormValues>({
    resolver: zodResolver(createRequestOrderFormSchema(t, internal)),
    defaultValues: {
      status: RequestOrderStatus.draft,
      name: "",
      note: "",
      intent: RequestOrderIntent.order,
      category: RequestOrderCategory.nonstock,
      priority: RequestOrderPriority.routine,
      reason: RequestOrderReason.ward_stock,
      supplier: undefined,
      origin: undefined,
      destination: locationId,
    },
  });

  useEffect(() => {
    if (isEditMode && existingData) {
      form.reset({
        status: existingData.status,
        name: existingData.name,
        note: existingData.note || "",
        intent: existingData.intent,
        category: existingData.category,
        priority: existingData.priority,
        reason: existingData.reason,
        supplier: existingData.supplier?.id || undefined,
        origin: existingData.origin?.id || undefined,
        destination: existingData.destination.id,
      });
    }
  }, [isEditMode, existingData, form]);

  const { mutate: createRequestOrder, isPending: isCreating } = useMutation({
    mutationFn: mutate(requestOrderApi.createRequestOrder, {
      pathParams: {
        facilityId: facilityId,
      },
    }),
    onSuccess: (requestOrder: RequestOrderRetrieve) => {
      queryClient.invalidateQueries({ queryKey: ["requestOrders"] });
      toast.success(t("order_created"));
      navigate(returnPath + requestOrder.id);
    },
  });

  const { mutate: updateRequestOrder, isPending: isUpdating } = useMutation({
    mutationFn: mutate(requestOrderApi.updateRequestOrder, {
      pathParams: {
        facilityId: facilityId,
        requestOrderId: requestOrderId!,
      },
    }),
    onSuccess: (requestOrder: RequestOrderRetrieve) => {
      queryClient.invalidateQueries({ queryKey: ["requestOrders"] });
      toast.success(t("order_updated"));
      navigate(returnPath + requestOrder.id);
    },
  });

  function onSubmit(data: FormValues) {
    if (isEditMode && requestOrderId) {
      updateRequestOrder({
        ...data,
        id: requestOrderId,
      });
    } else {
      createRequestOrder(data);
    }
  }

  const isPending = isCreating || isUpdating;

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
    <Page title={title} hideTitleOnPage shortCutContext="facility:inventory">
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
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="p-0  bg-gray-50">
              <CardContent className="space-y-4 p-4 rounded-md">
                <div className="grid sm:grid-cols-2 gap-4 items-start">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("name")}</FormLabel>
                        <FormControl>
                          <Input
                            className="h-9"
                            placeholder={t("enter_order_name")}
                            {...field}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={internal ? "origin" : "supplier"}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {internal ? t("deliver_from") : t("vendor")}
                        </FormLabel>
                        <FormControl>
                          <Autocomplete
                            options={
                              internal ? deliveryFromOptions : vendorOptions
                            }
                            value={field.value || ""}
                            onChange={field.onChange}
                            isLoading={
                              internal ? isLoadingDeliveryFromLocations : false
                            }
                            onSearch={
                              internal
                                ? setSearchDeliveryFrom
                                : setSupplierSearchQuery
                            }
                            placeholder={
                              internal
                                ? t("select_location")
                                : t("select_vendor")
                            }
                            inputPlaceholder={
                              internal
                                ? t("search_location")
                                : t("search_vendor")
                            }
                            noOptionsMessage={
                              internal
                                ? t("no_location_found")
                                : t("no_vendor_found")
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("note")}
                        <span className="text-gray-500 text-sm italic">
                          ({t("optional")})
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
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

                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            className="flex flex-col sm:flex-row gap-2"
                          >
                            {(isEditMode
                              ? [
                                  RequestOrderStatus.pending,
                                  RequestOrderStatus.abandoned,
                                  RequestOrderStatus.entered_in_error,
                                ]
                              : [
                                  RequestOrderStatus.draft,
                                  RequestOrderStatus.pending,
                                ]
                            ).map((status) => (
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
                            {Object.values(RequestOrderPriority).map(
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            {Object.values(RequestOrderReason).map((reason) => (
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
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="intent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("intent")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger
                              className="border border-gray-400"
                              ref={field.ref}
                            >
                              <SelectValue placeholder={t("select_intent")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(RequestOrderIntent).map((intent) => (
                              <SelectItem key={intent} value={intent}>
                                {t(intent)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("category")}</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          className="flex flex-col sm:flex-row gap-2"
                        >
                          {Object.values(RequestOrderCategory).map(
                            (category) => (
                              <div
                                key={category}
                                className={cn(
                                  "flex items-center space-x-2 rounded-md border border-gray-200 bg-white p-2",
                                  field.value === category &&
                                    "border-primary bg-primary/10",
                                )}
                              >
                                <RadioGroupItem
                                  value={category}
                                  id={category}
                                />
                                <Label htmlFor={category}>{t(category)}</Label>
                              </div>
                            ),
                          )}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigate(
                    requestOrderId ? returnPath + requestOrderId : returnPath,
                  )
                }
              >
                {t("cancel")}
                <ShortcutBadge actionId="cancel-action" />
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEditMode
                    ? t("saving")
                    : t("creating")
                  : isEditMode
                    ? t("save")
                    : t("create")}
                <ShortcutBadge actionId="submit-action" />
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Page>
  );
}
