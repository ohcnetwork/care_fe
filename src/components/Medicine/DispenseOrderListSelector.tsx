import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { DispenseOrderRead } from "@/types/emr/dispenseOrder/dispenseOrder";
import dispenseOrderApi from "@/types/emr/dispenseOrder/dispenseOrderApi";
import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";
import { ChevronDown, PackageIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DispenseOrderListSelectorProps {
  patientId: string;
  facilityId?: string;
  selectedDispenseOrderId?: string;
  onSelectDispenseOrder: (dispenseOrder: DispenseOrderRead | undefined) => void;
}

export default function DispenseOrderListSelector({
  patientId,
  facilityId,
  selectedDispenseOrderId,
  onSelectDispenseOrder,
}: DispenseOrderListSelectorProps) {
  const { t } = useTranslation();
  const [openDrawer, setOpenDrawer] = React.useState(false);
  const { data: dispenseOrders, isLoading } = useQuery({
    queryKey: ["dispenseOrders", patientId, facilityId],
    queryFn: query(dispenseOrderApi.list, {
      pathParams: { facilityId: facilityId ?? "" },
      queryParams: {
        patient: patientId,
      },
    }),
    enabled: !!patientId && !!facilityId,
  });

  function handleSelectDispenseOrder(
    dispenseOrder: DispenseOrderRead | undefined,
  ) {
    onSelectDispenseOrder(dispenseOrder);
    setOpenDrawer(false);
  }

  // Select first dispense order by default
  React.useEffect(() => {
    if (dispenseOrders?.results?.length) {
      if (!selectedDispenseOrderId) {
        onSelectDispenseOrder(dispenseOrders.results[0] as DispenseOrderRead);
      }
    } else {
      onSelectDispenseOrder(undefined);
    }
  }, [dispenseOrders, selectedDispenseOrderId, onSelectDispenseOrder]);

  if (isLoading) {
    return (
      <div className="space-y-3 w-60">
        <CardListSkeleton count={7} />
      </div>
    );
  }

  if (!dispenseOrders?.results?.length) {
    return null;
  }

  const selectedDispenseOrder = selectedDispenseOrderId
    ? dispenseOrders?.results.find(
        (order) => order.id === selectedDispenseOrderId,
      )
    : undefined;

  return (
    <>
      <div className="hidden lg:block h-full overflow-y-auto pr-1">
        <DispenseOrderList
          dispenseOrders={dispenseOrders.results as DispenseOrderRead[]}
          selectedDispenseOrderId={selectedDispenseOrderId}
          onSelectDispenseOrder={onSelectDispenseOrder}
        />
      </div>
      <div className="lg:hidden">
        <Drawer open={openDrawer} onOpenChange={setOpenDrawer}>
          <DrawerTrigger asChild>
            {selectedDispenseOrder ? (
              <Button
                variant="outline"
                className="w-full flex justify-between items-center py-6"
              >
                <div className="flex gap-3">
                  <PackageIcon className="size-5 text-primary-600" />
                  <div className="flex flex-col -mt-1 text-left">
                    <span className="text-sm font-medium whitespace-nowrap">
                      {selectedDispenseOrder.name ||
                        formatDateTime(
                          selectedDispenseOrder.created_date,
                          "DD/MM/YYYY hh:mm A",
                        )}
                    </span>
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      {t("location")}: {selectedDispenseOrder.location.name}
                    </span>
                  </div>
                </div>
                <ChevronDown className="size-5 text-gray-500 shrink-0 ml-2" />
              </Button>
            ) : (
              <Button variant="outline" className="w-full">
                {t("select_dispense_order")}
              </Button>
            )}
          </DrawerTrigger>

          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle>{t("dispense_orders")}</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto pr-2">
              <DispenseOrderList
                dispenseOrders={dispenseOrders.results as DispenseOrderRead[]}
                selectedDispenseOrderId={selectedDispenseOrderId}
                onSelectDispenseOrder={handleSelectDispenseOrder}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}

function DispenseOrderList({
  dispenseOrders,
  selectedDispenseOrderId,
  onSelectDispenseOrder,
}: {
  dispenseOrders: DispenseOrderRead[];
  selectedDispenseOrderId: string | undefined;
  onSelectDispenseOrder: (dispenseOrder: DispenseOrderRead | undefined) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2 p-2">
      {dispenseOrders.map((dispenseOrder) => {
        const isSelected = selectedDispenseOrderId === dispenseOrder.id;
        return (
          <Card
            key={dispenseOrder.id}
            className={cn(
              "rounded-md relative cursor-pointer transition-colors w-full",
              isSelected
                ? "bg-white border-primary-600 shadow-md"
                : "bg-gray-100 hover:bg-gray-100 shadow-none",
            )}
            onClick={() => onSelectDispenseOrder(dispenseOrder)}
          >
            {isSelected && (
              <div className="absolute right-0 h-8 w-1 bg-primary-600 rounded-l inset-y-1/2 -translate-y-1/2" />
            )}
            <CardContent className="flex flex-col px-4 py-3 gap-2">
              <div className="flex gap-3">
                <PackageIcon
                  className={cn(
                    "size-5",
                    isSelected ? "text-primary-600" : "text-gray-500",
                  )}
                />
                <div className="flex flex-col -mt-1">
                  <span className="text-sm font-medium whitespace-nowrap">
                    {dispenseOrder.name ||
                      formatDateTime(
                        dispenseOrder.created_date,
                        "DD/MM/YYYY hh:mm A",
                      )}
                  </span>
                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    {t("location")}: {dispenseOrder.location.name}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
