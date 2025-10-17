import { Box, Eye } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Common/Table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import { getInventoryBasePath } from "@/pages/Facility/services/inventory/externalSupply/utils/inventoryUtils";
import {
  DELIVERY_ORDER_STATUS_COLORS,
  DeliveryOrderRetrieve,
} from "@/types/inventory/deliveryOrder/deliveryOrder";

interface Props {
  deliveries: DeliveryOrderRetrieve[];
  isLoading: boolean;
  facilityId: string;
  locationId: string;
  internal: boolean;
  isRequester: boolean;
}

export default function DeliveryOrderTable({
  deliveries,
  isLoading,
  facilityId,
  locationId,
  internal,
  isRequester,
}: Props) {
  const { t } = useTranslation();

  if (isLoading) {
    return <TableSkeleton count={5} />;
  }

  if (deliveries.length === 0) {
    return (
      <EmptyState
        icon={<Box className="text-primary size-5" />}
        title={t("no_orders_found")}
        description={t("no_orders_found_description")}
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("name")}</TableHead>
          <TableHead>{internal ? t("origin") : t("supplier")}</TableHead>
          <TableHead>{t("deliver_to")}</TableHead>
          <TableHead>{t("status")}</TableHead>
          <TableHead className="w-28">{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deliveries.map((delivery: DeliveryOrderRetrieve) => (
          <TableRow key={delivery.id}>
            <TableCell>{delivery.name}</TableCell>
            <TableCell>
              {delivery.supplier?.name || delivery.origin?.name}
            </TableCell>
            <TableCell>{delivery.destination.name}</TableCell>
            <TableCell>
              <Badge variant={DELIVERY_ORDER_STATUS_COLORS[delivery.status]}>
                {t(delivery.status)}
              </Badge>
            </TableCell>
            <TableCell>
              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    getInventoryBasePath(
                      facilityId,
                      locationId,
                      internal,
                      false,
                      isRequester,
                      `${delivery.id}`,
                    ),
                  )
                }
              >
                <Eye />
                {t("view_details")}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
