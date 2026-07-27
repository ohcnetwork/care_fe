import { useQueryClient } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { formatDateTime, formatName } from "@/Utils/utils";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Common/Table";
import TagAssignmentSheet from "@/components/Tags/TagAssignmentSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { getInventoryBasePath } from "@/pages/Facility/services/inventory/externalSupply/utils/inventoryUtils";
import {
  REQUEST_ORDER_PRIORITY_COLORS,
  REQUEST_ORDER_STATUS_COLORS,
  RequestOrderRetrieve,
} from "@/types/inventory/requestOrder/requestOrder";

interface Props {
  requests: RequestOrderRetrieve[];
  isLoading: boolean;
  facilityId: string;
  locationId: string;
  internal: boolean;
  isRequester: boolean;
}

export default function RequestOrderTable({
  requests,
  isLoading,
  facilityId,
  locationId,
  internal,
  isRequester,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  if (isLoading) {
    return <TableSkeleton count={5} />;
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        title={t("no_orders_found")}
        description={t("no_orders_found_description")}
        icon={<CareIcon icon="l-box" className="text-primary size-6" />}
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
          <TableHead>{t("priority")}</TableHead>
          <TableHead className="w-48">{t("tags", { count: 2 })}</TableHead>
          <TableHead className="w-44">{t("created_by")}</TableHead>
          <TableHead className="w-28">{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request: RequestOrderRetrieve) => (
          <TableRow key={request.id}>
            <TableCell className="font-semibold">{request.name}</TableCell>
            <TableCell>
              {request.supplier?.name || request.origin?.name}
            </TableCell>
            <TableCell>{request.destination.name}</TableCell>
            <TableCell>
              <Badge variant={REQUEST_ORDER_STATUS_COLORS[request.status]}>
                {t(request.status)}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={REQUEST_ORDER_PRIORITY_COLORS[request.priority]}>
                {t(request.priority)}
              </Badge>
            </TableCell>
            <TableCell>
              <TagAssignmentSheet
                entityType="request_order"
                entityId={request.id}
                facilityId={facilityId}
                currentTags={request.tags ?? []}
                onUpdate={() => {
                  queryClient.invalidateQueries({
                    queryKey: ["requestOrders", locationId, internal],
                  });
                }}
              />
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">
                  {formatName(request.created_by)}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDateTime(request.created_date)}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Button
                variant="outline"
                className="shadow-sm font-semibold text-gray-950"
                onClick={() =>
                  navigate(
                    getInventoryBasePath(
                      facilityId,
                      locationId,
                      internal,
                      true,
                      isRequester,
                      `${request.id}`,
                    ),
                  )
                }
              >
                <Eye />
                {t("see_details")}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
