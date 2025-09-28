import { Eye } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import CareIcon from "@/CAREUI/icons/CareIcon";
import {
  DELIVERY_ORDER_STATUS_COLORS,
  DeliveryOrderRetrieve,
} from "@/types/inventory/deliveryOrder/deliveryOrder";

interface Props {
  deliverys: DeliveryOrderRetrieve[];
  isLoading: boolean;
  facilityId: string;
  locationId: string;
  internal: boolean;
}

export default function DeliveryOrderTable({
  deliverys,
  isLoading,
  facilityId,
  locationId,
  internal,
}: Props) {
  const { t } = useTranslation();

  if (isLoading) {
    return <TableSkeleton count={5} />;
  }

  if (deliverys.length === 0) {
    return (
      <EmptyState
        title={t("no_orders_found")}
        description={t("no_orders_found_description")}
        icon={<CareIcon icon="l-box" className="text-primary size-6" />}
      />
    );
  }

  return (
    <div className="rounded-md overflow-hidden border-2 border-white shadow-md">
      <Table>
        <TableHeader className="bg-gray-100">
          <TableRow className="divide-x">
            <TableHead className="text-gray-700">{t("name")}</TableHead>
            <TableHead className="text-gray-700">{t("supplier")}</TableHead>
            <TableHead className="text-gray-700">{t("deliver_to")}</TableHead>
            <TableHead className="text-gray-700">{t("status")}</TableHead>
            <TableHead className="w-[100px] text-gray-700">
              {t("actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white text-base">
          {deliverys.map((delivery: DeliveryOrderRetrieve) => (
            <TableRow key={delivery.id} className="divide-x">
              <TableCell className="font-semibold text-gray-950">
                {delivery.name}
              </TableCell>
              <TableCell className="font-medium text-gray-950">
                {delivery.supplier?.name || delivery.origin?.name}
              </TableCell>
              <TableCell className="font-medium text-gray-950">
                {delivery.destination.name}
              </TableCell>
              <TableCell>
                <Badge variant={DELIVERY_ORDER_STATUS_COLORS[delivery.status]}>
                  {t(delivery.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="md"
                  className="shadow-sm border-gray-400 font-semibold text-gray-950"
                  onClick={() =>
                    navigate(
                      `/facility/${facilityId}/locations/${locationId}/${
                        internal ? "internal_transfers" : "external_supply"
                      }/delivery_orders/${delivery.id}`,
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
    </div>
  );
}
