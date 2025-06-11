import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { FilterSelect } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";

import Page from "@/components/Common/Page";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import SupplyRequestTable from "@/pages/Facility/services/supply/components/SupplyRequestTable";
import {
  SupplyRequestPriority,
  SupplyRequestStatus,
} from "@/types/inventory/supplyRequest/supplyRequest";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";

interface Props {
  facilityId: string;
  locationId: string;
}

export function PurchaseOrders({ facilityId, locationId }: Props) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 14,
    disableCache: true,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["purchaseOrders", locationId, qParams],
    queryFn: query.debounced(supplyRequestApi.listSupplyRequest, {
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        status: qParams.status,
        priority: qParams.priority,
        deliver_to: locationId,
        deliver_from_isnull: true,
      },
    }),
  });

  const orders = response?.results || [];

  return (
    <Page title={t("purchase_orders")} hideTitleOnPage>
      <div className="container mx-auto">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("purchase_orders")}
            </h1>
            <Button
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/locations/${locationId}/external_supply/purchase_orders/new`,
                )
              }
            >
              <CareIcon icon="l-plus" />
              {t("create_purchase_order")}
            </Button>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder={t("search_purchase_orders")}
                value={qParams.search}
                onChange={(e) => updateQuery({ search: e.target.value })}
                className="w-full"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:flex-initial sm:w-auto">
                <FilterSelect
                  value={qParams.status || ""}
                  onValueChange={(value) => updateQuery({ status: value })}
                  options={Object.values(SupplyRequestStatus)}
                  label="status"
                  onClear={() => updateQuery({ status: undefined })}
                />
              </div>
              <div className="flex-1 sm:flex-initial sm:w-auto">
                <FilterSelect
                  value={qParams.priority || ""}
                  onValueChange={(value) => updateQuery({ priority: value })}
                  options={Object.values(SupplyRequestPriority)}
                  label="priority"
                  onClear={() => updateQuery({ priority: undefined })}
                />
              </div>
            </div>
          </div>
        </div>

        <SupplyRequestTable
          requests={orders}
          isLoading={isLoading}
          facilityId={facilityId}
          locationId={locationId}
          baseUrl="external_supply/purchase_orders"
          emptyTitle={t("no_purchase_orders_found")}
          emptyDescription={t("no_purchase_orders_found_description")}
        />

        <div className="mt-4">
          <Pagination totalCount={response?.count || 0} />
        </div>
      </div>
    </Page>
  );
}
