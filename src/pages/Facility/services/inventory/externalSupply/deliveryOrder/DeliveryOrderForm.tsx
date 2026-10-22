import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { navigate, useQueryParams } from "raviger";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import Page from "@/components/Common/Page";
import { FormSkeleton } from "@/components/Common/SkeletonLoading";
import { Form } from "@/components/ui/form";

import {
  ExtensionEntityType,
  getCombinedExtensionProps,
  NamespacedExtensionData,
  useEntityExtensions,
  useExtensionSchemas,
} from "@/hooks/useExtensions";
import { getInventoryBasePath } from "@/pages/Facility/services/inventory/externalSupply/utils/inventoryUtils";
import {
  DeliveryOrderRetrieve,
  DeliveryOrderStatus,
} from "@/types/inventory/deliveryOrder/deliveryOrder";
import deliveryOrderApi from "@/types/inventory/deliveryOrder/deliveryOrderApi";
import requestOrderApi from "@/types/inventory/requestOrder/requestOrderApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { ExtensionContexts } from "@/Utils/schema/types";

import { DeliveryOrderFormContent } from "./DeliveryOrderFormContent";

const createBaseSchema = (t: (key: string) => string, internal: boolean) =>
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
    tags: z.array(z.string()),
  });

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
  const { getExtensions, isLoading: isExtensionsLoading } =
    useExtensionSchemas();
  const isEditMode = Boolean(deliveryOrderId);
  const [qParams] = useQueryParams();
  const supplyOrderId = qParams.supplyOrder;
  const queryClient = useQueryClient();

  const { data: existingData, isFetching } = useQuery({
    queryKey: ["deliveryOrder", deliveryOrderId],
    queryFn: query(deliveryOrderApi.retrieveDeliveryOrder, {
      pathParams: { facilityId, deliveryOrderId: deliveryOrderId! },
    }),
    enabled: isEditMode,
  });

  const { data: supplyOrderData, isFetching: isFetchingSupplyOrder } = useQuery(
    {
      queryKey: ["requestOrder", supplyOrderId],
      queryFn: query(requestOrderApi.retrieveRequestOrder, {
        pathParams: { facilityId, requestOrderId: supplyOrderId! },
      }),
      enabled: !!supplyOrderId && !isEditMode,
    },
  );

  const ext = useMemo(
    () =>
      getCombinedExtensionProps(
        getExtensions(ExtensionEntityType.supply_delivery_order, "write"),
        ExtensionContexts.supply_delivery_order_form,
      ),
    [getExtensions],
  );

  const formSchema = useMemo(
    () =>
      createBaseSchema(t, internal).extend({
        extensions: ext.validation.optional(),
      }),
    [t, internal, ext.validation],
  );

  type FormValues = z.infer<typeof formSchema>;
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      note: "",
      supplier: undefined,
      origin: internal ? locationId : undefined,
      destination: internal ? "" : locationId,
      tags: [],
      extensions: ext.defaults,
    },
  });

  const extensions = useEntityExtensions({
    entityType: ExtensionEntityType.supply_delivery_order,
    schemaType: "write",
    context: ExtensionContexts.supply_delivery_order_form,
    form,
    existingData: existingData?.extensions as
      Record<string, Record<string, unknown>> | undefined,
  });

  useEffect(() => {
    if (isEditMode && existingData) {
      form.reset({
        name: existingData.name,
        note: existingData.note || "",
        supplier: existingData.supplier?.id || undefined,
        origin: existingData.origin?.id || undefined,
        destination: existingData.destination.id,
        tags: existingData.tags.map((tag) => tag.id),
        extensions: { ...extensions.defaults, ...existingData.extensions },
      });
    } else if (!isEditMode && supplyOrderData) {
      form.reset({
        name: supplyOrderData.name,
        note: supplyOrderData.note || "",
        supplier: supplyOrderData.supplier?.id || undefined,
        origin: supplyOrderData.origin?.id || undefined,
        destination: supplyOrderData.destination.id,
        tags: supplyOrderData.tags.map((tag) => tag.id),
        extensions: extensions.defaults,
      });
    }
  }, [isEditMode, existingData, supplyOrderData, form, extensions.defaults]);

  useEffect(() => {
    if (isEditMode || supplyOrderId) return;
    if (internal && form.getValues("destination") === locationId) {
      form.setValue("destination", "");
    }
    form.setValue(internal ? "origin" : "destination", locationId);
  }, [locationId, internal, isEditMode, supplyOrderId, form]);

  const { mutate: createDeliveryOrder, isPending: isCreating } = useMutation({
    mutationFn: mutate(deliveryOrderApi.createDeliveryOrder, {
      pathParams: { facilityId },
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
        {
          replace: true,
        },
      );
    },
  });

  const { mutate: updateDeliveryOrder, isPending: isUpdating } = useMutation({
    mutationFn: mutate(deliveryOrderApi.updateDeliveryOrder, {
      pathParams: { facilityId, deliveryOrderId: deliveryOrderId! },
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
    const { extensions: formExtensions, ...restData } = data;
    const cleanedExtensions = extensions.prepareForSubmit(
      formExtensions as NamespacedExtensionData,
    );

    if (isEditMode && deliveryOrderId) {
      updateDeliveryOrder({
        ...restData,
        id: deliveryOrderId,
        status: existingData?.status || DeliveryOrderStatus.draft,
        extensions: cleanedExtensions,
      });
    } else {
      createDeliveryOrder({
        ...restData,
        status: DeliveryOrderStatus.draft,
        extensions: cleanedExtensions,
      });
    }
  }

  const title = isEditMode ? t("edit_delivery") : t("create_delivery");
  const isPending = isCreating || isUpdating;

  if (
    isExtensionsLoading ||
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
    <Form {...form}>
      <DeliveryOrderFormContent
        facilityId={facilityId}
        locationId={locationId}
        internal={internal}
        supplyOrderId={supplyOrderId}
        title={title}
        status={existingData?.status || DeliveryOrderStatus.draft}
        isEditMode={isEditMode}
        isPending={isPending}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {extensions.fields}
      </DeliveryOrderFormContent>
    </Form>
  );
}
