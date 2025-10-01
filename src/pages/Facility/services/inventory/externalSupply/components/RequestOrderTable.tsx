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
    <div className="rounded-md overflow-hidden border-2 border-white shadow-md">
      <Table>
        <TableHeader className="bg-gray-100">
          <TableRow className="divide-x">
            <TableHead className="text-gray-700">{t("name")}</TableHead>
            <TableHead className="text-gray-700">{t("supplier")}</TableHead>
            <TableHead className="text-gray-700">{t("deliver_to")}</TableHead>
            <TableHead className="text-gray-700">{t("status")}</TableHead>
            <TableHead className="text-gray-700">{t("priority")}</TableHead>
            <TableHead className="w-[100px] text-gray-700">
              {t("actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white text-base">
          {requests.map((request: RequestOrderRetrieve) => (
            <TableRow key={request.id} className="divide-x">
              <TableCell className="font-semibold text-gray-950">
                {request.name}
              </TableCell>
              <TableCell className="font-medium text-gray-950">
                {request.supplier?.name}
              </TableCell>
              <TableCell className="font-medium text-gray-950">
                {request.destination.name}
              </TableCell>
              <TableCell>
                <Badge variant={REQUEST_ORDER_STATUS_COLORS[request.status]}>
                  {t(request.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={REQUEST_ORDER_PRIORITY_COLORS[request.priority]}
                >
                  {t(request.priority)}
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
                      }/orders/${isRequester ? "outgoing" : "incoming"}/${request.id}`,
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
