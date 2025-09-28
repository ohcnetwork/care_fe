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
import { Textarea } from "@/components/ui/textarea";

import Page from "@/components/Common/Page";
import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import useAppHistory from "@/hooks/useAppHistory";

import Autocomplete from "@/components/ui/autocomplete";
import {
  DeliveryOrderRetrieve,
  DeliveryOrderStatus,
} from "@/types/inventory/deliveryOrder/deliveryOrder";
import deliveryOrderApi from "@/types/inventory/deliveryOrder/deliveryOrderApi";
import { LocationList } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";
import organizationApi from "@/types/organization/organizationApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";

const createDeliveryOrderFormSchema = (internal: boolean) =>
  z.object({
    status: z.nativeEnum(DeliveryOrderStatus),
    name: z.string().min(1, "Name is required"),
    note: z.string().optional(),
    supplier: internal
      ? z.string().optional()
      : z.string().min(1, "Supplier is required"),
    origin: internal
      ? z.string().min(1, "Origin location is required")
      : z.string().optional(),
    destination: z.string().min(1, "Destination is required"),
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

  const { goBack } = useAppHistory();
  const isEditMode = Boolean(deliveryOrderId);

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

  const title = isEditMode ? t("edit_order") : t("create_order");

  const returnPath = `/facility/${facilityId}/locations/${locationId}/${
    internal ? "internal_transfers" : "external_supply"
  }/delivery_orders`;

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
    resolver: zodResolver(createDeliveryOrderFormSchema(internal)),
    defaultValues: {
      status: DeliveryOrderStatus.draft,
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
        status: existingData.status,
        name: existingData.name,
        note: existingData.note || "",
        supplier: existingData.supplier?.id || undefined,
        origin: existingData.origin?.id || undefined,
        destination: existingData.destination.id,
      });
    }
  }, [isEditMode, existingData, form]);

  const { mutate: createDeliveryOrder, isPending: isCreating } = useMutation({
    mutationFn: mutate(deliveryOrderApi.createDeliveryOrder, {
      pathParams: {
        facilityId: facilityId,
      },
    }),
    onSuccess: (deliveryOrder: DeliveryOrderRetrieve) => {
      queryClient.invalidateQueries({ queryKey: ["deliveryOrders"] });
      toast.success(t("order_created"));
      navigate(returnPath + "/" + deliveryOrder.id);
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
      navigate(returnPath + "/" + deliveryOrder.id);
    },
  });

  function onSubmit(data: FormValues) {
    if (isEditMode && deliveryOrderId) {
      updateDeliveryOrder({
        ...data,
        id: deliveryOrderId,
      });
    } else {
      createDeliveryOrder(data);
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
    <Page
      title={title}
      hideTitleOnPage
      shortCutContext="facility:inventory:delivery"
    >
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("name")} *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("enter_order_name")}
                            {...field}
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
                          {internal ? t("deliver_to") : t("vendor")} *
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
                      <FormLabel>{t("note")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("enter_notes_optional")}
                          rows={3}
                          {...field}
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

                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            className="flex flex-col sm:flex-row gap-2"
                          >
                            {(isEditMode
                              ? [
                                  DeliveryOrderStatus.pending,
                                  DeliveryOrderStatus.abandoned,
                                  DeliveryOrderStatus.entered_in_error,
                                ]
                              : [
                                  DeliveryOrderStatus.draft,
                                  DeliveryOrderStatus.pending,
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
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => navigate(returnPath)}>
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
