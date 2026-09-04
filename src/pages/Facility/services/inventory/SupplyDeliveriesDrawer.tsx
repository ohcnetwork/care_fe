import { useQuery } from "@tanstack/react-query";
import { Truck } from "lucide-react";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import { SupplyDeliveryTable } from "@/pages/Facility/services/inventory/SupplyDeliveryTable";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import query from "@/Utils/request/query";

interface SupplyDeliveriesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  facilityId: string;
  queryParams: Record<string, string | number | boolean | undefined>;
  enabled?: boolean;
  internal?: boolean;
  isRequester?: boolean;
  linkToProduct?: boolean;
  header?: ReactNode;
}

export function SupplyDeliveriesDrawer({
  open,
  onOpenChange,
  title,
  facilityId,
  queryParams,
  enabled = true,
  internal = false,
  isRequester,
  linkToProduct,
  header,
}: SupplyDeliveriesDrawerProps) {
  const { t } = useTranslation();

  const { data: supplyDeliveries, isLoading } = useQuery({
    queryKey: ["supplyDeliveriesDrawer", facilityId, queryParams],
    queryFn: query.paginated(supplyDeliveryApi.listSupplyDelivery, {
      queryParams: { facility: facilityId, ...queryParams },
    }),
    enabled: open && enabled,
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-7xl mx-auto px-4 sm:px-16 pb-10">
        <DrawerHeader>
          <DrawerTitle>{title ?? t("all_deliveries")}</DrawerTitle>
        </DrawerHeader>
        <div className="pt-2">
          {header}
          <div className="space-y-4 max-h-[68vh] overflow-y-auto px-4 pt-4">
            {isLoading ? (
              <TableSkeleton count={3} />
            ) : supplyDeliveries?.results &&
              supplyDeliveries.results.length > 0 ? (
              <SupplyDeliveryTable
                deliveries={supplyDeliveries.results}
                internal={internal}
                isRequester={isRequester}
                facilityId={facilityId}
                linkToProduct={linkToProduct}
              />
            ) : (
              <EmptyState
                icon={<Truck className="size-5 text-primary-600" />}
                title={t("no_deliveries_found")}
                description={t("no_deliveries_found_description")}
              />
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
