import { useQuery } from "@tanstack/react-query";
import { CheckCircleIcon, TruckIcon } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { FilterSelect } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";

import Page from "@/components/Common/Page";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import SupplyDeliveryTable from "@/pages/Facility/services/supply/components/SupplyDeliveryTable";
import { SupplyDeliveryStatus } from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";

interface Props {
  facilityId: string;
  locationId: string;
}

export function IncomingDeliveries({ facilityId, locationId }: Props) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 14,
    disableCache: true,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["externalSupplyDeliveries", qParams],
    queryFn: query.debounced(supplyDeliveryApi.listSupplyDelivery, {
      queryParams: {
        facility: facilityId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        status: qParams.status,
        destination: locationId,
        origin_isnull: true,
      },
    }),
  });

  const deliveries = response?.results || [];

  return (
    <Page title={t("incoming_deliveries")} hideTitleOnPage>
      <div className="container mx-auto">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("incoming_deliveries")}
            </h1>

            <div className="flex flex-row gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link
                  href="/external_supply/receive"
                  className="flex items-center gap-2"
                >
                  <TruckIcon />
                  {t("receive_stock")}
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link
                  href="/external_supply/incoming_deliveries/approve"
                  className="flex items-center gap-2"
                >
                  <CheckCircleIcon />
                  {t("approve_deliveries")}
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              {/* TODO: replace this with supplier / product knowledge filter */}
              <Input
                placeholder={t("search_incoming_deliveries")}
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
                  options={Object.values(SupplyDeliveryStatus)}
                  label="status"
                  onClear={() => updateQuery({ status: undefined })}
                />
              </div>
            </div>
          </div>
        </div>

        <SupplyDeliveryTable
          deliveries={deliveries}
          isLoading={isLoading}
          facilityId={facilityId}
          locationId={locationId}
        />

        <div className="mt-4">
          <Pagination totalCount={response?.count || 0} />
        </div>
      </div>
    </Page>
  );
}
