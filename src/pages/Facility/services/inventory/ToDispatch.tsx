import { useQuery } from "@tanstack/react-query";
import { navigate, useQueryParams } from "raviger";
import { useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInventoryBasePath } from "@/pages/Facility/services/inventory/externalSupply/utils/inventoryUtils";

import Page from "@/components/Common/Page";

import useFilters from "@/hooks/useFilters";

import { RequestOrderPriority } from "@/types/inventory/requestOrder/requestOrder";
import query from "@/Utils/request/query";

import { FilterSelect } from "@/components/ui/filter-select";
import { NavTabs } from "@/components/ui/nav-tabs";
import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import DeliveryOrderTable from "@/pages/Facility/services/inventory/externalSupply/components/DeliveryOrderTable";
import RequestOrderTable from "@/pages/Facility/services/inventory/externalSupply/components/RequestOrderTable";
import deliveryOrderApi from "@/types/inventory/deliveryOrder/deliveryOrderApi";
import requestOrderApi from "@/types/inventory/requestOrder/requestOrderApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";

interface Props {
  facilityId: string;
  locationId: string;
  internal: boolean;
  tab: string;
}

export function ToDispatch({ facilityId, locationId, internal, tab }: Props) {
  const { t } = useTranslation();
  const currentTab = tab === "deliveries" ? "deliveries" : "orders";
  const { location } = useCurrentLocation();

  return (
    <Page
      title={t("to_dispatch")}
      hideTitleOnPage
      shortCutContext="facility:inventory"
    >
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {t("to_dispatch")}
            </h1>
            <p className="text-sm text-gray-500">
              <Trans
                i18nKey="to_dispatch_description"
                values={{
                  location: location?.name,
                }}
                components={{
                  strong: <strong className="font-semibold" />,
                }}
              />
            </p>
          </div>
        </div>
        <NavTabs
          className="w-full mt-2"
          tabContentClassName="mt-2"
          tabs={{
            orders: {
              label: t("requests_to_dispatch"),
              component: (
                <IncomingOrdersTab
                  facilityId={facilityId}
                  locationId={locationId}
                  internal={internal}
                />
              ),
            },
            deliveries: {
              label: t("outgoing_deliveries"),
              component: (
                <OutgoingDeliveriesTab
                  facilityId={facilityId}
                  locationId={locationId}
                  internal={internal}
                />
              ),
            },
          }}
          currentTab={currentTab}
          onTabChange={(value) => {
            navigate(
              getInventoryBasePath(
                facilityId,
                locationId,
                internal,
                value === "orders",
                false,
              ),
            );
          }}
        />
      </div>
    </Page>
  );
}

function IncomingOrdersTab({
  facilityId,
  locationId,
  internal,
}: {
  facilityId: string;
  locationId: string;
  internal: boolean;
}) {
  const { t } = useTranslation();

  const [qParams] = useQueryParams();
  const { updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 14,
    disableCache: true,
  });

  const EFFECTIVE_STATUSES = [
    { value: "pending", label: "pending" },
    { value: "completed", label: "completed" },
  ];

  useEffect(() => {
    if (!qParams.status) {
      updateQuery({ status: EFFECTIVE_STATUSES[0].value });
    }
  }, [qParams.status]);

  const { data: response, isLoading } = useQuery({
    queryKey: ["requestOrders", locationId, internal, qParams],
    queryFn: query.debounced(requestOrderApi.listRequestOrder, {
      pathParams: { facilityId: facilityId },
      queryParams: {
        origin: locationId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        status: qParams.status,
        origin_isnull: !internal,
        priority: qParams.priority,
      },
    }),
  });

  const orders = response?.results || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <Tabs value={qParams.status}>
          <TabsList>
            {EFFECTIVE_STATUSES.map((status) => (
              <TabsTrigger
                key={status.value}
                value={status.value}
                onClick={() => updateQuery({ status: status.value })}
              >
                {t(status.label)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="w-full sm:w-auto">
          <FilterSelect
            value={qParams.priority || ""}
            onValueChange={(value) => updateQuery({ priority: value })}
            options={Object.values(RequestOrderPriority)}
            label={t("priority")}
            onClear={() => updateQuery({ priority: undefined })}
            className="w-full sm:w-auto h-9"
            placeholder={t("filter_by_priority")}
          />
        </div>
      </div>
      <RequestOrderTable
        requests={orders}
        isLoading={isLoading}
        facilityId={facilityId}
        locationId={locationId}
        internal={internal}
        isRequester={false}
      />
      <div className="mt-4">
        <Pagination totalCount={response?.count || 0} />
      </div>
    </div>
  );
}

function OutgoingDeliveriesTab({
  facilityId,
  locationId,
  internal,
}: {
  facilityId: string;
  locationId: string;
  internal: boolean;
}) {
  const { t } = useTranslation();

  const [qParams] = useQueryParams();
  const { updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 14,
    disableCache: true,
  });

  const EFFECTIVE_STATUSES = [
    { value: "draft,pending", label: "created" },
    { value: "completed,abandoned,entered_in_error", label: "completed" },
  ];

  useEffect(() => {
    if (!qParams.status) {
      updateQuery({ status: EFFECTIVE_STATUSES[0].value });
    }
  }, [qParams.status]);

  const { data: response, isLoading } = useQuery({
    queryKey: ["deliveryOrders", locationId, internal, qParams],
    queryFn: query.debounced(deliveryOrderApi.listDeliveryOrder, {
      pathParams: { facilityId: facilityId },
      queryParams: {
        origin: locationId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        status: qParams.status,
        origin_isnull: !internal,
        priority: qParams.priority,
      },
    }),
  });

  const orders = response?.results || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <Tabs value={qParams.status}>
          <TabsList>
            {EFFECTIVE_STATUSES.map((status) => (
              <TabsTrigger
                key={status.value}
                value={status.value}
                onClick={() => updateQuery({ status: status.value })}
              >
                {t(status.label)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() =>
              navigate(
                getInventoryBasePath(
                  facilityId,
                  locationId,
                  internal,
                  false,
                  false,
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
      </div>
      <DeliveryOrderTable
        deliveries={orders}
        isLoading={isLoading}
        facilityId={facilityId}
        locationId={locationId}
        internal={internal}
        isRequester={false}
      />
      <div className="mt-4">
        <Pagination totalCount={response?.count || 0} />
      </div>
    </div>
  );
}
