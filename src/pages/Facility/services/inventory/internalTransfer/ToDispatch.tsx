import useBreakpoints from "@/hooks/useBreakpoints";
import { useQuery } from "@tanstack/react-query";
import { navigate, useQueryParams } from "raviger";
import { Trans, useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { FilterTabs } from "@/components/ui/filter-tabs";

import Page from "@/components/Common/Page";

import query from "@/Utils/request/query";
import SupplyDeliveryTable from "@/pages/Facility/services/inventory/internalTransfer/SupplyDeliveryTable";
import ToDispatchSupplyRequestTable from "@/pages/Facility/services/inventory/internalTransfer/ToDispatchSupplyRequestTable";
import { SupplyDeliveryStatus } from "@/types/inventory/supplyDelivery/supplyDelivery";
import locationApi from "@/types/location/locationApi";
import { PlusIcon } from "lucide-react";

interface Props {
  facilityId: string;
  locationId: string;
}

type Tab =
  | "requests_to_dispatch"
  | "in_progress"
  | "completed"
  | "abandoned"
  | "entered_in_error";

export default function ToDispatch({ facilityId, locationId }: Props) {
  const { t } = useTranslation();
  const [qParams, setQueryParams] = useQueryParams();
  const currentTab = (qParams.tab as Tab) || "requests_to_dispatch";

  const { data: location } = useQuery({
    queryKey: ["location", facilityId, locationId],
    queryFn: query(locationApi.get, {
      pathParams: { facility_id: facilityId, id: locationId },
    }),
  });

  const handleTabChange = (value: string) => {
    const { status: _, ...newParams } = qParams;
    setQueryParams({
      ...newParams,
      tab: value,
      page: "1",
    });
  };

  const tabOptions: Tab[] = [
    "requests_to_dispatch",
    "in_progress",
    "completed",
    "abandoned",
    "entered_in_error",
  ];

  const maxVisibleTabs = useBreakpoints({
    default: 2,
    xs: 3,
    sm: 5,
  });

  return (
    <Page title={t("to_dispatch")} hideTitleOnPage>
      <div className="space-y-4">
        <div className="flex flex-col">
          <p className="text-sm text-gray-700">
            {location?.name} ({t("internal_transfers")})
          </p>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t("to_dispatch")}
              </h2>
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
              onClick={() => {
                navigate(
                  `/facility/${facilityId}/locations/${locationId}/internal_transfers/create_delivery`,
                );
              }}
              className="whitespace-nowrap bg-primary-700 hover:bg-primary-800"
            >
              <PlusIcon className="size-4" />
              {t("return_excess_stock")}
            </Button>
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
          {currentTab === "requests_to_dispatch" && (
            <ToDispatchSupplyRequestTable
              facilityId={facilityId}
              locationId={locationId}
            />
          )}

          {currentTab === "in_progress" && (
            <SupplyDeliveryTable
              facilityId={facilityId}
              locationId={locationId}
              defaultStatus={SupplyDeliveryStatus.in_progress}
            />
          )}

          {currentTab === "completed" && (
            <SupplyDeliveryTable
              facilityId={facilityId}
              locationId={locationId}
              defaultStatus={SupplyDeliveryStatus.completed}
            />
          )}

          {currentTab === "abandoned" && (
            <SupplyDeliveryTable
              facilityId={facilityId}
              locationId={locationId}
              defaultStatus={SupplyDeliveryStatus.abandoned}
            />
          )}

          {currentTab === "entered_in_error" && (
            <SupplyDeliveryTable
              facilityId={facilityId}
              locationId={locationId}
              defaultStatus={SupplyDeliveryStatus.entered_in_error}
            />
          )}
        </div>
      </div>
    </Page>
  );
}
