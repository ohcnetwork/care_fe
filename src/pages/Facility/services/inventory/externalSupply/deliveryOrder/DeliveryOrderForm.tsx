import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { navigate, useQueryParams } from "raviger";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

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
import { Textarea } from "@/components/ui/textarea";

import Page from "@/components/Common/Page";
import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import BackButton from "@/components/Common/BackButton";
import Autocomplete from "@/components/ui/autocomplete";
import { Badge } from "@/components/ui/badge";
import { getInventoryBasePath } from "@/pages/Facility/services/inventory/externalSupply/utils/inventoryUtils";
import {
  DELIVERY_ORDER_STATUS_COLORS,
  DeliveryOrderRetrieve,
  DeliveryOrderStatus,
} from "@/types/inventory/deliveryOrder/deliveryOrder";
import deliveryOrderApi from "@/types/inventory/deliveryOrder/deliveryOrderApi";
import requestOrderApi from "@/types/inventory/requestOrder/requestOrderApi";
import { LocationList } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";
import organizationApi from "@/types/organization/organizationApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";

const createDeliveryOrderFormSchema = (
  t: (key: string) => string,
  internal: boolean,
) =>
  z.object({
    name: z.string().min(1, t("name_is_required")),
    note: z.string().optional(),
    supplier: internal
      ? z.string().optional()
      : z.string().min(1, t("supplier_required")),
    origin: internal
      ? z.string().min(1, t("origin_required"))
      : z.string().optional(),
    destination: z.string().min(1, t("destination_required")),
  });

type FormValues = z.infer<ReturnType<typeof createDeliveryOrderFormSchema>>;

interface Props {
  facilityId: string;
  locationId: string;
  internal: boolean;
  deliveryOrderId?: string;
}

export default function DeliveryOrderForm({
  facilityId,
  locationId,
  internal,
  deliveryOrderId,
}: Props) {
  const { t } = useTranslation();

  const isEditMode = Boolean(deliveryOrderId);
  const [qParams] = useQueryParams();
  const supplyOrderId = qParams.supplyOrder;

  const { data: existingData, isFetching } = useQuery({
    queryKey: ["deliveryOrder", deliveryOrderId],
    queryFn: query(deliveryOrderApi.retrieveDeliveryOrder, {
      pathParams: {
        facilityId: facilityId,
        deliveryOrderId: deliveryOrderId!,
      },
    }),
    enabled: isEditMode,
  });

  const { data: supplyOrderData, isFetching: isFetchingSupplyOrder } = useQuery(
    {
      queryKey: ["requestOrder", supplyOrderId],
      queryFn: query(requestOrderApi.retrieveRequestOrder, {
        pathParams: {
          facilityId: facilityId,
          requestOrderId: supplyOrderId!,
        },
      }),
      enabled: !!supplyOrderId && !isEditMode,
    },
  );

  const title = isEditMode ? t("edit_delivery") : t("create_delivery");

  const returnPath = getInventoryBasePath(
    facilityId,
    locationId,
    internal,
    false,
    false,
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
    resolver: zodResolver(createDeliveryOrderFormSchema(t, internal)),
    defaultValues: {
      name: "",
      note: "",
      supplier: undefined,
      origin: internal ? locationId : undefined,
      destination: internal ? "" : locationId,
    },
  });

  useEffect(() => {
    if (isEditMode && existingData) {
      form.reset({
        name: existingData.name,
        note: existingData.note || "",
        supplier: existingData.supplier?.id || undefined,
        origin: existingData.origin?.id || undefined,
        destination: existingData.destination.id,
      });
    } else if (!isEditMode && supplyOrderData) {
      // Prefill form with supply order data
      form.reset({
        name: supplyOrderData.name,
        note: supplyOrderData.note || "",
        supplier: supplyOrderData.supplier?.id || undefined,
        origin: supplyOrderData.origin?.id || undefined,
        destination: supplyOrderData.destination.id,
      });
    }
  }, [isEditMode, existingData, supplyOrderData, form]);

  const { mutate: createDeliveryOrder, isPending: isCreating } = useMutation({
    mutationFn: mutate(deliveryOrderApi.createDeliveryOrder, {
      pathParams: {
        facilityId: facilityId,
      },
    }),
    onSuccess: (deliveryOrder: DeliveryOrderRetrieve) => {
      queryClient.invalidateQueries({ queryKey: ["deliveryOrders"] });
      toast.success(t("order_created"));
      navigate(
        getInventoryBasePath(
          facilityId,
          locationId,
          internal,
          false,
          false,
          `${deliveryOrder.id}${supplyOrderId ? `?supplyOrder=${supplyOrderId}` : ""}`,
        ),
      );
    },
  });

  const { mutate: updateDeliveryOrder, isPending: isUpdating } = useMutation({
    mutationFn: mutate(deliveryOrderApi.updateDeliveryOrder, {
      pathParams: {
        facilityId: facilityId,
        deliveryOrderId: deliveryOrderId!,
      },
    }),
    onSuccess: (deliveryOrder: DeliveryOrderRetrieve) => {
      queryClient.invalidateQueries({ queryKey: ["deliveryOrders"] });
      toast.success(t("order_updated"));

      navigate(
        getInventoryBasePath(
          facilityId,
          locationId,
          internal,
          false,
          false,
          `${deliveryOrder.id}${supplyOrderId ? `?supplyOrder=${supplyOrderId}` : ""}`,
        ),
      );
    },
  });

  function onSubmit(data: FormValues) {
    if (isEditMode && deliveryOrderId) {
      updateDeliveryOrder({
        ...data,
        id: deliveryOrderId,
        status: existingData?.status || DeliveryOrderStatus.draft,
      });
    } else {
      createDeliveryOrder({
        ...data,
        status: DeliveryOrderStatus.draft,
      });
    }
  }

  const isPending = isCreating || isUpdating;

  if (
    (isEditMode && isFetching) ||
    (!isEditMode && supplyOrderId && isFetchingSupplyOrder)
  ) {
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
    <Page
      title={title}
      hideTitleOnPage
      shortCutContext="facility:inventory:delivery"
    >
      <div className="container mx-auto max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            {title}
            <Badge
              variant={
                DELIVERY_ORDER_STATUS_COLORS[
                  existingData?.status || DeliveryOrderStatus.draft
                ]
              }
            >
              {t(existingData?.status || DeliveryOrderStatus.draft)}
            </Badge>
          </h1>
          <BackButton variant="outline" size="icon">
            <X className="size-5" />
            <span className="sr-only">{t("close")}</span>
          </BackButton>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <input type="submit" hidden />
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
                            autoFocus
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={internal ? "destination" : "supplier"}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {internal ? t("deliver_to") : t("vendor")}
                        </FormLabel>
                        <FormControl>
                          <Autocomplete
                            disabled={internal && supplyOrderId}
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
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(returnPath)}
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
                <ShortcutBadge actionId="enter-action" />
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Page>
  );
}
