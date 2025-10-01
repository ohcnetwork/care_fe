import { useQuery } from "@tanstack/react-query";
import { BarChart3, Check } from "lucide-react";
import { navigate, useQueryParams } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { OrgSelect } from "@/components/Common/OrgSelect";
import Page from "@/components/Common/Page";

import useFilters from "@/hooks/useFilters";

import {
  REQUEST_ORDER_PRIORITY_COLORS,
  RequestOrderPriority,
} from "@/types/inventory/requestOrder/requestOrder";
import query from "@/Utils/request/query";

import RequestOrderTable from "@/pages/Facility/services/inventory/externalSupply/components/RequestOrderTable";
import requestOrderApi from "@/types/inventory/requestOrder/requestOrderApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";

interface Props {
  facilityId: string;
  locationId: string;
  internal: boolean;
  isRequester: boolean;
}

export function RequestOrderList({
  facilityId,
  locationId,
  internal,
  isRequester,
}: Props) {
  const { t } = useTranslation();

  const [qParams, setQueryParams] = useQueryParams();
  const TABS_CONFIG = isRequester
    ? [
        { value: "draft,pending", label: "requested" },
        {
          value: "completed,abandoned,entered_in_error",
          label: "Completed",
        },
      ]
    : ([
        { value: "pending", label: "pending" },
        {
          value: "completed",
          label: "completed",
        },
      ] as const);

  type Tab = (typeof TABS_CONFIG)[number]["value"];
  const currentTab = (qParams.tab as Tab) || TABS_CONFIG[0].value;
  const { updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 14,
    disableCache: true,
  });
  const [priorityPopoverOpen, setPriorityPopoverOpen] = useState(false);

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
      "requestOrders",
      locationId,
      internal,
      isRequester,
      qParams,
      effectiveStatus,
    ],
    queryFn: query.debounced(requestOrderApi.listRequestOrder, {
      pathParams: { facilityId: facilityId },
      queryParams: {
        ...(isRequester ? { destination: locationId } : { origin: locationId }),
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        status: effectiveStatus,
        origin_isnull: !internal,
        supplier: qParams.supplier,
        priority: qParams.priority,
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

      <Popover open={priorityPopoverOpen} onOpenChange={setPriorityPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="gap-2 font-medium"
          >
            <BarChart3 className="size-4" />
            <span>{t("filter_by_priority")}</span>
            {qParams.priority && (
              <Badge
                variant={
                  REQUEST_ORDER_PRIORITY_COLORS[
                    qParams.priority as RequestOrderPriority
                  ]
                }
                className="ml-2"
              >
                {t(qParams.priority)}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandGroup>
              {Object.values(RequestOrderPriority).map((priority) => (
                <CommandItem
                  key={priority}
                  value={priority}
                  onSelect={() => {
                    updateQuery({
                      priority:
                        qParams.priority === priority ? undefined : priority,
                    });
                    setPriorityPopoverOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      qParams.priority === priority
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {t(priority)}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <Page
      title={t(internal ? "orders" : "purchase_orders")}
      hideTitleOnPage
      shortCutContext="facility:inventory"
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {internal ? t("orders") : t("purchase_orders")}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/locations/${locationId}/${
                    internal ? "internal_transfers" : "external_supply"
                  }/request_orders/new`,
                )
              }
            >
              <CareIcon icon="l-plus" />
              {t("create_order")}
              <ShortcutBadge actionId="create-order" />
            </Button>
          </div>
        </div>

        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <TabsList className="w-full justify-evenly sm:justify-start border-b rounded-none bg-transparent p-0 h-auto overflow-x-auto">
            {TABS_CONFIG.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="border-b-3 px-2.5 py-1 font-semibold text-gray-600 hover:text-gray-900 data-[state=active]:border-b-primary-700  data-[state=active]:text-primary-800 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
              >
                {t(tab.label)}
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS_CONFIG.map((tab) => (
            <TabsContent
              key={tab.value}
              value={tab.value}
              className="mt-2 space-y-4"
            >
              {renderFilters()}
              <RequestOrderTable
                requests={orders}
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
