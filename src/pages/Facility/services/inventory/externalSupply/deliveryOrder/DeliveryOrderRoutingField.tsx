import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
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
}

export function DeliveryOrderRoutingField({
  facilityId,
  locationId,
  internal,
  supplyOrderId,
}: DeliveryOrderRoutingFieldProps) {
  const { t } = useTranslation();
  const form = useFormContext<{ supplier?: string; destination: string }>();
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
        name: searchDeliveryFrom,
        limit: 100,
        mode: "kind",
        ordering: "sort_index",
      },
    }),
    select: (data: PaginatedResponse<LocationRead>) =>
      data.results.filter((location) => location.id !== locationId),
  });

  const vendorOptions =
    availableSuppliers?.results.map((s) => ({ label: s.name, value: s.id })) ||
    [];
  const deliveryFromOptions =
    deliveryFromLocations?.map((l) => ({ label: l.name, value: l.id })) || [];

  return (
    <FormField
      control={form.control}
      name={internal ? "destination" : "supplier"}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{internal ? t("deliver_to") : t("vendor")}</FormLabel>
          <FormControl>
            <Autocomplete
              disabled={internal && !!supplyOrderId}
              options={internal ? deliveryFromOptions : vendorOptions}
              value={field.value || ""}
              onChange={field.onChange}
              isLoading={internal ? isLoadingDeliveryFromLocations : false}
              onSearch={
                internal ? setSearchDeliveryFrom : setSupplierSearchQuery
              }
              placeholder={internal ? t("select_location") : t("select_vendor")}
              inputPlaceholder={
                internal ? t("search_location") : t("search_vendor")
              }
              noOptionsMessage={
                internal ? t("no_location_found") : t("no_vendor_found")
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
