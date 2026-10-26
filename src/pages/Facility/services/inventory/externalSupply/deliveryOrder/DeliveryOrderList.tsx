import { useQuery } from "@tanstack/react-query";
import { navigate, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { PLUGIN_Component } from "@/PluginEngine";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { OrgSelect } from "@/components/Common/OrgSelect";
import Page from "@/components/Common/Page";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";

import DeliveryOrderTable from "@/pages/Facility/services/inventory/externalSupply/components/DeliveryOrderTable";
import { getInventoryBasePath } from "@/pages/Facility/services/inventory/externalSupply/utils/inventoryUtils";
import deliveryOrderApi from "@/types/inventory/deliveryOrder/deliveryOrderApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";

interface Props {
  facilityId: string;
  locationId: string;
  internal: boolean;
  isRequester: boolean;
}

export function DeliveryOrderList({
  facilityId,
  locationId,
  internal,
  isRequester,
}: Props) {
  const { t } = useTranslation();

  const [qParams, setQueryParams] = useQueryParams();

  const TABS_CONFIG = internal
    ? isRequester
      ? [
          { value: "pending", label: "in_transit" },
          {
            value: "completed",
            label: "Completed",
          },
        ]
      : [
          { value: "draft,pending", label: "created" },
          {
            value: "completed,abandoned,entered_in_error",
            label: "completed",
          },
        ]
    : ([
        { value: "draft,pending", label: "created" },
        {
          value: "completed,abandoned,entered_in_error",
          label: "completed",
        },
      ] as const);

  type Tab = (typeof TABS_CONFIG)[number]["value"];
  const currentTab = (qParams.tab as Tab) || TABS_CONFIG[0].value;
  const { updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 14,
    disableCache: true,
  });

  const handleTabChange = (value: string) => {
    setQueryParams({
      ...qParams,
      tab: value,
      page: "1",
    });
  };

  const effectiveStatus =
    TABS_CONFIG.find((tab) => tab.value === currentTab)?.value ||
    TABS_CONFIG[0].value;

  const { data: response, isLoading } = useQuery({
    queryKey: [
      "deliveryOrders",
      facilityId,
      locationId,
      internal,
      isRequester,
      qParams,
      effectiveStatus,
    ],
    queryFn: query.debounced(deliveryOrderApi.listDeliveryOrder, {
      pathParams: { facilityId: facilityId },
      queryParams: {
        ...(isRequester ? { destination: locationId } : { origin: locationId }),
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        status: effectiveStatus,
        origin_isnull: !internal,
        supplier: qParams.supplier,
        priority: qParams.priority,
        patient_isnull: true,
      },
    }),
  });

  const orders = response?.results || [];

  const renderFilters = () => (
    <div className="flex flex-col md:flex-row gap-4">
      <OrgSelect
        value={qParams.supplier}
        onChange={(supplier) => updateQuery({ supplier: supplier?.id })}
        orgType="product_supplier"
        placeholder={t("search_by_supplier")}
        inputPlaceholder={t("search_vendor")}
        noOptionsMessage={t("no_vendor_found")}
        className="w-[250px]"
      />
    </div>
  );

  return (
    <Page
      title={internal ? t("delivery") : t("inward_entry")}
      hideTitleOnPage
      shortCutContext="facility:inventory"
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {internal ? t("delivery") : t("inward_entry")}
            </h1>
          </div>
          {(!isRequester || !internal) && (
            <div className="flex items-center gap-2">
              {!internal && (
                <PLUGIN_Component
                  __name="DeliveryOrderActions"
                  facilityId={facilityId}
                  locationId={locationId}
                />
              )}
              <Button
                variant="primary"
                onClick={() =>
                  navigate(
                    getInventoryBasePath(
                      facilityId,
                      locationId,
                      internal,
                      false,
                      isRequester,
                      "new",
                    ),
                  )
                }
              >
                <CareIcon icon="l-plus" />
                {t("create_delivery")}
                <ShortcutBadge actionId="create-order" />
              </Button>
            </div>
          )}
        </div>

        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <div className="w-full overflow-x-auto pb-1">
            <TabsList
              variant="line"
              className="w-full justify-evenly border-b border-border sm:justify-start"
            >
              {TABS_CONFIG.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {t(tab.label)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {TABS_CONFIG.map((tab) => (
            <TabsContent
              key={tab.value}
              value={tab.value}
              className="mt-2 space-y-4"
            >
              {renderFilters()}
              <DeliveryOrderTable
                deliveries={orders}
                isLoading={isLoading}
                facilityId={facilityId}
                locationId={locationId}
                internal={internal}
                isRequester={isRequester}
              />
              <div className="mt-4">
                <Pagination totalCount={response?.count || 0} />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Page>
  );
}
