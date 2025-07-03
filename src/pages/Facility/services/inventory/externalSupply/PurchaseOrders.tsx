import { useQuery } from "@tanstack/react-query";
import { BarChart3, Check } from "lucide-react";
import { navigate, useQueryParams } from "raviger";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";

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

import query from "@/Utils/request/query";
import { ProductKnowledgeSelect } from "@/pages/Facility/services/inventory/ProductKnowledgeSelect";
import PurchaseOrderTable from "@/pages/Facility/services/inventory/externalSupply/components/PurchaseOrderTable";
import { ProductKnowledgeStatus } from "@/types/inventory/productKnowledge/productKnowledge";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";
import {
  SUPPLY_REQUEST_PRIORITY_COLORS,
  SupplyRequestPriority,
} from "@/types/inventory/supplyRequest/supplyRequest";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";
import locationApi from "@/types/location/locationApi";

interface Props {
  facilityId: string;
  locationId: string;
}

const TABS_CONFIG = [
  { value: "pending_pos", label: "pending_pos", status: "active" },
  { value: "draft", label: "draft", status: "draft" },
  { value: "processed", label: "processed", status: "processed" },
  { value: "completed", label: "completed", status: "completed" },
  { value: "suspended", label: "suspended", status: "suspended" },
  { value: "cancelled", label: "cancelled", status: "cancelled" },
  {
    value: "entered_in_error",
    label: "entered_in_error",
    status: "entered_in_error",
  },
] as const;

type Tab = (typeof TABS_CONFIG)[number]["value"];

export function PurchaseOrders({ facilityId, locationId }: Props) {
  const { t } = useTranslation();
  const [qParams, setQueryParams] = useQueryParams();
  const currentTab = (qParams.tab as Tab) || "pending_pos";
  const { updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 14,
    disableCache: true,
  });
  const [priorityPopoverOpen, setPriorityPopoverOpen] = useState(false);

  const { data: location } = useQuery({
    queryKey: ["location", facilityId, locationId],
    queryFn: query(locationApi.get, {
      pathParams: { facility_id: facilityId, id: locationId },
    }),
  });

  const handleTabChange = (value: string) => {
    setQueryParams({
      ...qParams,
      tab: value,
      page: "1",
    });
  };

  const effectiveStatus =
    TABS_CONFIG.find((tab) => tab.value === currentTab)?.status || "active";

  const { data: productKnowledgeResponse } = useQuery({
    queryKey: ["productKnowledge", facilityId],
    queryFn: query(productKnowledgeApi.listProductKnowledge, {
      queryParams: {
        facility: facilityId,
        limit: 100,
        status: ProductKnowledgeStatus.active,
      },
    }),
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["purchaseOrders", locationId, qParams, effectiveStatus],
    queryFn: query.debounced(supplyRequestApi.listSupplyRequest, {
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        status: effectiveStatus,
        priority: qParams.priority,
        deliver_to: locationId,
        deliver_from_isnull: true,
        item: qParams.item,
        supplier: qParams.supplier,
      },
    }),
  });

  const orders = response?.results || [];
  const productKnowledges = productKnowledgeResponse?.results || [];
  const selectedProduct = productKnowledges.find((p) => p.id === qParams.item);

  const renderFilters = () => (
    <div className="flex items-center gap-4">
      <ProductKnowledgeSelect
        value={selectedProduct}
        onChange={(product) => updateQuery({ item: product?.id })}
        placeholder={t("search_by_item")}
        className="placeholder:font-semibold"
      />

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
                  SUPPLY_REQUEST_PRIORITY_COLORS[
                    qParams.priority as SupplyRequestPriority
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
              {Object.values(SupplyRequestPriority).map((priority) => (
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
    <Page title={t("purchase_orders")} hideTitleOnPage>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {t("purchase_orders")}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              <Trans
                i18nKey="raise_dispatch_request"
                values={{
                  location: location?.name,
                }}
                components={{
                  strong: <span className="font-medium text-gray-700" />,
                }}
              />
            </p>
          </div>
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
              <PurchaseOrderTable
                requests={orders}
                isLoading={isLoading}
                facilityId={facilityId}
                locationId={locationId}
                emptyTitle={t("no_purchase_orders_found")}
                emptyDescription={t("no_purchase_orders_found_description")}
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
