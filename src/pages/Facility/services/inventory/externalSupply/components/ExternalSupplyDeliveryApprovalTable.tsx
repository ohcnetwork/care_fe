import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import query from "@/Utils/request/query";
import { SupplyDeliveryDetails } from "@/pages/Facility/services/supply/components/SupplyDeliveryDetails";
import SupplyRequestDetails from "@/pages/Facility/services/supply/components/SupplyRequestDetails";
import {
  SupplyDeliveryCondition,
  SupplyDeliveryRead,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";

interface Props {
  deliveries: SupplyDeliveryRead[];
  isLoading: boolean;
  selectedDeliveries: SupplyDeliveryRead[];
  onDeliverySelect: (delivery: SupplyDeliveryRead) => void;
  onDeliveryConditionChange: (
    deliveryId: string,
    condition: SupplyDeliveryCondition,
  ) => void;
  facilityId: string;
  locationId: string;
}

export default function ExternalSupplyDeliveryApprovalTable({
  deliveries,
  isLoading,
  selectedDeliveries,
  onDeliverySelect,
  onDeliveryConditionChange,
  facilityId,
  locationId,
}: Props) {
  const { t } = useTranslation();

  if (isLoading) {
    return <TableSkeleton count={5} />;
  }

  if (deliveries.length === 0) {
    return (
      <EmptyState
        title={t("no_supply_deliveries_found")}
        description={t("no_supply_deliveries_found_description")}
        icon="l-box"
      />
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={
                  deliveries.length > 0 &&
                  deliveries.every((delivery) =>
                    selectedDeliveries.some((d) => d.id === delivery.id),
                  )
                }
                onCheckedChange={(checked) => {
                  deliveries.forEach((delivery) => {
                    if (
                      checked &&
                      !selectedDeliveries.some((d) => d.id === delivery.id)
                    ) {
                      onDeliverySelect(delivery);
                    } else if (
                      !checked &&
                      selectedDeliveries.some((d) => d.id === delivery.id)
                    ) {
                      onDeliverySelect(delivery);
                    }
                  });
                }}
              />
            </TableHead>
            <TableHead>{t("product")}</TableHead>
            <TableHead>{t("batch")}</TableHead>
            <TableHead>{t("quantity")}</TableHead>
            <TableHead>{t("supplier")}</TableHead>
            <TableHead>{t("origin")}</TableHead>
            <TableHead>{t("condition")}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {deliveries.map((delivery) => {
            const isSelected = selectedDeliveries.some(
              (d) => d.id === delivery.id,
            );
            const selectedDelivery = selectedDeliveries.find(
              (d) => d.id === delivery.id,
            );

            const rowBackgroundColor = isSelected
              ? selectedDelivery?.supplied_item_condition ===
                SupplyDeliveryCondition.damaged
                ? "bg-red-50 hover:bg-red-100"
                : "bg-green-50 hover:bg-green-100"
              : "";

            return (
              <TableRow key={delivery.id} className={rowBackgroundColor}>
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onDeliverySelect(delivery)}
                  />
                </TableCell>
                <TableCell>
                  {delivery.supplied_item?.product_knowledge.name ||
                    delivery.supplied_inventory_item?.product.product_knowledge
                      .name}
                </TableCell>
                <TableCell>
                  {delivery.supplied_item?.batch?.lot_number ||
                    delivery.supplied_inventory_item?.product.batch
                      ?.lot_number ||
                    t("not_specified")}
                </TableCell>
                <TableCell>{delivery.supplied_item_quantity}</TableCell>
                <TableCell>
                  {delivery.supplier?.name || t("not_specified")}
                </TableCell>
                <TableCell>
                  {delivery.origin?.name || t("not_specified")}
                </TableCell>
                <TableCell>
                  <Select
                    value={
                      isSelected
                        ? selectedDelivery?.supplied_item_condition ||
                          SupplyDeliveryCondition.normal
                        : delivery.supplied_item_condition ||
                          SupplyDeliveryCondition.normal
                    }
                    onValueChange={(value: SupplyDeliveryCondition) =>
                      onDeliveryConditionChange(delivery.id, value)
                    }
                    disabled={!isSelected}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SupplyDeliveryCondition.normal}>
                        {t("normal")}
                      </SelectItem>
                      <SelectItem value={SupplyDeliveryCondition.damaged}>
                        {t("damaged")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <ViewSupplyDeliveryDialog
                    deliveryId={delivery.id}
                    facilityId={facilityId}
                    locationId={locationId}
                    trigger={
                      <Button variant="outline" size="sm">
                        <CareIcon icon="l-eye" />
                        {t("view")}
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

interface ViewSupplyDeliveryDialogProps {
  deliveryId: string;
  trigger: React.ReactNode;
  facilityId: string;
  locationId: string;
}

function ViewSupplyDeliveryDialog({
  deliveryId,
  trigger,
  facilityId,
  locationId,
}: ViewSupplyDeliveryDialogProps) {
  const { t } = useTranslation();

  const { data: delivery } = useQuery({
    queryKey: ["supply-delivery", deliveryId],
    queryFn: query(supplyDeliveryApi.retrieveSupplyDelivery, {
      pathParams: { supplyDeliveryId: deliveryId },
    }),
  });

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {t("supply_delivery_details")}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{deliveryId}</p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <SupplyDeliveryDetails deliveryId={deliveryId} />
          {delivery?.supply_request && (
            <SupplyRequestDetails
              request={delivery.supply_request}
              facilityId={facilityId}
              locationId={locationId}
              showViewDetails
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
