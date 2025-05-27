import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { FilterSelect } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { SupplyDeliveryStatus } from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";

import SupplyDeliveryTable from "./components/SupplyDeliveryTable";

export enum SupplyDeliveryTab {
  INCOMING = "incoming",
  OUTGOING = "outgoing",
}

interface Props {
  facilityId: string;
  locationId: string;
  tab?: SupplyDeliveryTab;
  type?: "internal" | "external";
}

export default function SupplyDeliveryList({
  facilityId,
  locationId,
  tab,
  type,
}: Props) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 14,
    disableCache: true,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["supplyDeliveries", qParams, tab],
    queryFn: query.debounced(supplyDeliveryApi.listSupplyDelivery, {
      queryParams: {
        facility: facilityId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        search: qParams.search,
        status: qParams.status,
        destination:
          tab === SupplyDeliveryTab.INCOMING ? locationId : undefined,
        origin:
          tab === SupplyDeliveryTab.OUTGOING &&
          (type == null || type === "internal")
            ? locationId
            : undefined,
        origin_isnull: type === "external",
      },
    }),
  });

  const deliveries = response?.results || [];

  return (
    <Page title={t("supply_deliveries")} hideTitleOnPage>
      <div className="container mx-auto">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("supply_deliveries")}
            </h1>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder={t("search_supply_deliveries")}
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

          <div className="flex flex-row justify-between items-center gap-2">
            {(type == null || type === "internal") && (
              <Tabs
                value={tab}
                onValueChange={(value) =>
                  navigate(
                    `/facility/${facilityId}/locations/${locationId}/supply_deliveries/${value}`,
                  )
                }
                className="max-sm:hidden"
              >
                <TabsList>
                  <TabsTrigger value="incoming">{t("incoming")}</TabsTrigger>
                  <TabsTrigger value="outgoing">{t("outgoing")}</TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            <Select
              value={tab}
              onValueChange={(value) =>
                navigate(
                  `/facility/${facilityId}/locations/${locationId}/supply_deliveries/${value}`,
                )
              }
            >
              <SelectTrigger className="sm:hidden">
                <SelectValue placeholder={t("filter_by_delivery")} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="incoming">{t("incoming")}</SelectItem>
                  <SelectItem value="outgoing">{t("outgoing")}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SupplyDeliveryTable
          deliveries={deliveries}
          isLoading={isLoading}
          facilityId={facilityId}
          locationId={locationId}
          tab={tab ?? SupplyDeliveryTab.INCOMING}
        />

        <div className="mt-4">
          <Pagination totalCount={response?.count || 0} />
        </div>
      </div>
    </Page>
  );
}
