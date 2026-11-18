import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { LocationRead } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";
import organizationApi from "@/types/organization/organizationApi";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";

interface DeliveryOrderRoutingFieldProps {
  facilityId: string;
  locationId: string;
  internal: boolean;
  supplyOrderId?: string;
  // Internal transfers to a supplier location also name the supplier the stock goes back to
  showSupplier?: boolean;
  isEditMode?: boolean;
}

export function DeliveryOrderRoutingField({
  facilityId,
  locationId,
  internal,
  supplyOrderId,
  showSupplier = false,
  isEditMode = false,
}: DeliveryOrderRoutingFieldProps) {
  const { t } = useTranslation();
  const form = useFormContext<{ supplier?: string; destination: string }>();
  const destination = useWatch({ control: form.control, name: "destination" });
  const supplier = useWatch({ control: form.control, name: "supplier" });
  const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
  const [searchDeliveryFrom, setSearchDeliveryFrom] = useState("");
  const hasSupplierField = !internal || showSupplier;

  const { data: availableSuppliers } = useQuery({
    queryKey: ["organizations", supplierSearchQuery],
    queryFn: query.debounced(organizationApi.list, {
      queryParams: {
        org_type: "product_supplier",
        name: supplierSearchQuery || undefined,
      },
    }),
    enabled: hasSupplierField,
  });
  const suppliers = availableSuppliers?.results ?? [];
  const isSupplierListed = suppliers.some((s) => s.id === supplier);

  // A saved supplier may not be on the first page of results, so fetch it to show its name
  const { data: selectedSupplier } = useQuery({
    queryKey: ["organizations", supplier, "selected"],
    queryFn: query(organizationApi.get, {
      pathParams: { id: supplier! },
    }),
    enabled: hasSupplierField && !!supplier && !isSupplierListed,
  });

  const {
    data: deliveryFromLocations,
    isLoading: isLoadingDeliveryFromLocations,
  } = useQuery({
    queryKey: ["locations", facilityId, searchDeliveryFrom],
    queryFn: query.debounced(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        name: searchDeliveryFrom,
        limit: 100,
        mode: "kind",
        ordering: "sort_index",
      },
    }),
    select: (data: PaginatedResponse<LocationRead>) =>
      // Only inventory locations other than the current one; keep the selected
      // destination (e.g. from a supply order) so it still shows
      data.results.filter(
        (location) =>
          location.id !== locationId &&
          (location.inventory_usage !== "none" || location.id === destination),
      ),
    enabled: internal,
  });

  const vendorOptions = [
    ...suppliers,
    ...(selectedSupplier && !isSupplierListed ? [selectedSupplier] : []),
  ].map((s) => ({ label: s.name, value: s.id }));
  const deliveryFromOptions =
    deliveryFromLocations?.map((l) => ({ label: l.name, value: l.id })) || [];

  const supplierField = (
    <FormField
      control={form.control}
      name="supplier"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("vendor")}</FormLabel>
          <FormControl>
            <Autocomplete
              // Care sets a transfer's supplier only when it is created
              disabled={internal && isEditMode}
              options={vendorOptions}
              value={field.value || ""}
              onChange={field.onChange}
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
  );

  if (!internal) {
    return supplierField;
  }

  return (
    <>
      <FormField
        control={form.control}
        name="destination"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("deliver_to")}</FormLabel>
            <FormControl>
              <Autocomplete
                disabled={!!supplyOrderId}
                options={deliveryFromOptions}
                value={field.value || ""}
                onChange={field.onChange}
                isLoading={isLoadingDeliveryFromLocations}
                onSearch={setSearchDeliveryFrom}
                placeholder={t("select_location")}
                inputPlaceholder={t("search_location")}
                noOptionsMessage={t("no_location_found")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {showSupplier && supplierField}
    </>
  );
}
