import { useQuery } from "@tanstack/react-query";
import { TruckIcon } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { OrgSelect } from "@/components/Common/OrgSelect";
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

  const TABS_CONFIG = [
    {
      value: "in_progress",
      label: t("in_progress"),
      status: SupplyDeliveryStatus.in_progress,
    },
    {
      value: "completed",
      label: t("completed"),
      status: SupplyDeliveryStatus.completed,
    },
    {
      value: "abandoned",
      label: t("abandoned"),
      status: SupplyDeliveryStatus.abandoned,
    },
    {
      value: "entered_in_error",
      label: t("entered_in_error"),
      status: SupplyDeliveryStatus.entered_in_error,
    },
  ];
  const currentTab =
    TABS_CONFIG.find((tab) => tab.status === qParams.status)?.value ||
    "in_progress";
  function handleTabChange(value: string) {
    const tab = TABS_CONFIG.find((tab) => tab.value === value);
    if (!tab) return;
    updateQuery({
      status: tab.status,
      page: "1",
    });
  }

  const { data: response, isLoading } = useQuery({
    queryKey: ["externalSupplyDeliveries", facilityId, locationId, qParams],
    queryFn: query.debounced(supplyDeliveryApi.listSupplyDelivery, {
      queryParams: {
        facility: facilityId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        status: qParams.status || "in_progress",
        destination: locationId,
        origin_isnull: true,
        supplier: qParams.supplier || undefined,
      },
    }),
  });

  const deliveries = response?.results || [];

  return (
    <Page title={t("inward_entry")} hideTitleOnPage>
      <div className="container mx-auto">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("inward_entry")}
            </h1>

            <div className="flex flex-row gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link
                  href="/external_supply/inward_entry/receive"
                  className="flex items-center gap-2"
                >
                  <TruckIcon />
                  {t("receive_stock")}
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-4">
          <Tabs value={currentTab} onValueChange={handleTabChange}>
            <TabsList className="w-full justify-evenly sm:justify-start border-b rounded-none bg-transparent p-0 h-auto overflow-x-auto">
              {TABS_CONFIG.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="border-b-3 px-2.5 py-1 font-semibold text-gray-600 hover:text-gray-900 data-[state=active]:border-b-primary-700  data-[state=active]:text-primary-800 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <OrgSelect
                value={qParams.supplier}
                onChange={(supplier) => updateQuery({ supplier: supplier?.id })}
                orgType="product_supplier"
                placeholder={t("search_vendor")}
                inputPlaceholder={t("search_vendor")}
                noOptionsMessage={t("no_vendor_found")}
              />
            </div>
          </div>
        </div>

        <SupplyDeliveryTable
          deliveries={deliveries}
          isLoading={isLoading}
          facilityId={facilityId}
          locationId={locationId}
          showSupplier={true}
          showDate={true}
        />

        <div className="mt-4">
          <Pagination totalCount={response?.count || 0} />
        </div>
      </div>
    </Page>
  );
}
