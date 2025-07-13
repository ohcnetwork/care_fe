import { PlusIcon } from "lucide-react";
import { useNavigate, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";

import SupplyDeliveryTable from "@/pages/Facility/services/inventory/internalTransfer/SupplyDeliveryTable";
import ToReceiveSupplyRequestTable from "@/pages/Facility/services/inventory/internalTransfer/ToReceiveSupplyRequestTable";
import { SupplyDeliveryStatus } from "@/types/inventory/supplyDelivery/supplyDelivery";

interface Props {
  facilityId: string;
  locationId: string;
}

type Tab =
  | "requests_raised"
  | "receive_items"
  | "received"
  | "abandoned"
  | "entered_in_error";

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

        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <TabsList className="w-full justify-start border-b border-gray-200 bg-transparent p-0 h-auto rounded-none">
            <TabsTrigger
              value="requests_raised"
              className="border-0 border-b-2 border-transparent px-4 py-2 text-gray-600 hover:text-gray-900 data-[state=active]:text-primary-800 data-[state=active]:border-primary-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
            >
              {t("requests_raised")}
            </TabsTrigger>
            <TabsTrigger
              value="receive_items"
              className="border-0 border-b-2 border-transparent px-4 py-2 text-gray-600 hover:text-gray-900 data-[state=active]:text-primary-800 data-[state=active]:border-primary-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
            >
              {t("receive_items")}
            </TabsTrigger>
            <TabsTrigger
              value="received"
              className="border-0 border-b-2 border-transparent px-4 py-2 text-gray-600 hover:text-gray-900 data-[state=active]:text-primary-800 data-[state=active]:border-primary-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
            >
              {t("received")}
            </TabsTrigger>
            <TabsTrigger
              value="abandoned"
              className="border-0 border-b-2 border-transparent px-4 py-2 text-gray-600 hover:text-gray-900 data-[state=active]:text-primary-800 data-[state=active]:border-primary-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
            >
              {t("abandoned")}
            </TabsTrigger>
            <TabsTrigger
              value="entered_in_error"
              className="border-0 border-b-2 border-transparent px-4 py-2 text-gray-600 hover:text-gray-900 data-[state=active]:text-primary-800 data-[state=active]:border-primary-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
            >
              {t("entered_in_error")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests_raised" className="mt-4 space-y-4">
            <ToReceiveSupplyRequestTable
              facilityId={facilityId}
              locationId={locationId}
            />
          </TabsContent>

          <TabsContent value="receive_items" className="mt-4">
            <SupplyDeliveryTable
              facilityId={facilityId}
              locationId={locationId}
              defaultStatus={SupplyDeliveryStatus.in_progress}
              mode="receive"
            />
          </TabsContent>

          <TabsContent value="received" className="mt-4">
            <SupplyDeliveryTable
              facilityId={facilityId}
              locationId={locationId}
              defaultStatus={SupplyDeliveryStatus.completed}
              mode="receive"
            />
          </TabsContent>

          <TabsContent value="abandoned" className="mt-4">
            <SupplyDeliveryTable
              facilityId={facilityId}
              locationId={locationId}
              defaultStatus={SupplyDeliveryStatus.abandoned}
              mode="receive"
            />
          </TabsContent>

          <TabsContent value="entered_in_error" className="mt-4">
            <SupplyDeliveryTable
              facilityId={facilityId}
              locationId={locationId}
              defaultStatus={SupplyDeliveryStatus.entered_in_error}
              mode="receive"
            />
          </TabsContent>
        </Tabs>
      </div>
    </Page>
  );
}
