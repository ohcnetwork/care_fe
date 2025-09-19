import useBreakpoints from "@/hooks/useBreakpoints";
import { PlusIcon } from "lucide-react";
import { useNavigate, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { FilterTabs } from "@/components/ui/filter-tabs";

import Page from "@/components/Common/Page";

import SupplyDeliveryTable from "@/pages/Facility/services/inventory/internalTransfer/SupplyDeliveryTable";
import ToReceiveSupplyRequestTable from "@/pages/Facility/services/inventory/internalTransfer/ToReceiveSupplyRequestTable";
import { SupplyDeliveryStatus } from "@/types/inventory/supplyDelivery/supplyDelivery";

interface Props {
  facilityId: string;
  locationId: string;
}

enum Tab {
  REQUESTS_RAISED = "requests_raised",
  RECEIVE_ITEMS = "receive_items",
  RECEIVED = "received",
  ABANDONED = "abandoned",
  ENTERED_IN_ERROR = "entered_in_error",
}

export default function ToReceive({ facilityId, locationId }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [qParams, setQueryParams] = useQueryParams();
  const currentTab = (qParams.tab as Tab) || "requests_raised";

  const handleTabChange = (value: string) => {
    const { status: _, ...newParams } = qParams;
    setQueryParams({
      ...newParams,
      tab: value,
      page: "1",
    });
  };

  const tabOptions = Object.values(Tab);

  const maxVisibleTabs = useBreakpoints({
    default: 2,
    xs: 3,
    sm: 5,
  });

  return (
    <Page title={t("to_receive")} hideTitleOnPage>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t("to_receive")}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {t("to_receive_description")}
            </p>
          </div>
          <div>
            {currentTab === "requests_raised" && (
              <Button
                onClick={() => {
                  navigate(
                    "/internal_transfers/to_receive/raise_stock_request",
                  );
                }}
                className="whitespace-nowrap bg-primary-700 hover:bg-primary-800"
              >
                <PlusIcon className="size-4" />
                {t("raise_stock_request")}
              </Button>
            )}
          </div>
        </div>

        <div className="w-full justify-start border-b border-gray-200 bg-transparent p-0 h-auto rounded-none overflow-x-auto">
          <FilterTabs
            value={currentTab}
            onValueChange={handleTabChange}
            options={tabOptions}
            variant="underline"
            showMoreDropdown
            maxVisibleTabs={maxVisibleTabs}
            defaultVisibleOptions={tabOptions}
            showAllOption={false}
          />
        </div>

        <div className="mt-4">
          {currentTab === "requests_raised" && (
            <ToReceiveSupplyRequestTable
              facilityId={facilityId}
              locationId={locationId}
            />
          )}

          {currentTab === "receive_items" && (
            <SupplyDeliveryTable
              facilityId={facilityId}
              locationId={locationId}
              defaultStatus={SupplyDeliveryStatus.in_progress}
              mode="receive"
            />
          )}

          {currentTab === "received" && (
            <SupplyDeliveryTable
              facilityId={facilityId}
              locationId={locationId}
              defaultStatus={SupplyDeliveryStatus.completed}
              mode="receive"
            />
          )}

          {currentTab === "abandoned" && (
            <SupplyDeliveryTable
              facilityId={facilityId}
              locationId={locationId}
              defaultStatus={SupplyDeliveryStatus.abandoned}
              mode="receive"
            />
          )}

          {currentTab === "entered_in_error" && (
            <SupplyDeliveryTable
              facilityId={facilityId}
              locationId={locationId}
              defaultStatus={SupplyDeliveryStatus.entered_in_error}
              mode="receive"
            />
          )}
        </div>
      </div>
    </Page>
  );
}
