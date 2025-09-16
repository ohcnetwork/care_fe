import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Edit, MoreVertical } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import BackButton from "@/components/Common/BackButton";
import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import query from "@/Utils/request/query";
import {
  SUPPLY_REQUEST_PRIORITY_COLORS,
  SUPPLY_REQUEST_STATUS_COLORS,
  SupplyRequestRead,
} from "@/types/inventory/supplyRequest/supplyRequest";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";
import organizationApi from "@/types/organization/organizationApi";

interface Props {
  facilityId: string;
  locationId: string;
  supplierId: string;
}

export default function PurchaseOrdersBySupplier({
  facilityId: _facilityId,
  locationId,
  supplierId,
}: Props) {
  const { t } = useTranslation();

  const { data: supplier } = useQuery({
    queryKey: ["organization", supplierId],
    queryFn: query(organizationApi.get, {
      pathParams: { id: supplierId },
    }),
    enabled: !!supplierId,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["purchaseOrdersBySupplier", locationId, supplierId],
    queryFn: query(supplyRequestApi.listSupplyRequest, {
      queryParams: {
        deliver_to: locationId,
        deliver_from_isnull: true,
        supplier: supplierId,
      },
    }),
  });

  const purchaseOrders = response?.results || [];

  if (isLoading) {
    return (
      <Page title={t("purchase_orders_by_supplier")} hideTitleOnPage>
        <div className="p-4">
          <BackButton>
            <ArrowLeft />
            <span>{t("back")}</span>
          </BackButton>
          <TableSkeleton count={5} />
        </div>
      </Page>
    );
  }

  if (!purchaseOrders.length) {
    return (
      <Page title={t("purchase_orders_by_supplier")} hideTitleOnPage>
        <div className="p-4">
          <BackButton>
            <ArrowLeft />
            <span>{t("back")}</span>
          </BackButton>
          <p>{t("no_purchase_orders_found")}</p>
        </div>
      </Page>
    );
  }

  const firstOrder = purchaseOrders[0];

  return (
    <Page title={t("purchase_orders_by_supplier")} hideTitleOnPage>
      <div className="p-2">
        <BackButton>
          <ArrowLeft />
          <span>{t("back")}</span>
        </BackButton>
      </div>
      <div className="space-y-2 px-4 pb-2">
        <div className="p-4 flex flex-row justify-between">
          <div className="flex gap-8 justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">{t("distributor")}</p>
              <h2 className="text-lg font-bold text-gray-800">
                {supplier?.name}
              </h2>
              <p className="text-sm text-gray-600">
                {supplier?.description?.slice(0, 10)}
              </p>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-sm text-gray-500">{t("entry_date")}</p>
                <p className="font-semibold">{t("na")}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{t("status")}</p>
                <Badge
                  variant={SUPPLY_REQUEST_STATUS_COLORS[firstOrder.status]}
                >
                  {t(firstOrder.status)}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{t("priority")}</p>
                <Badge
                  variant={SUPPLY_REQUEST_PRIORITY_COLORS[firstOrder.priority]}
                >
                  {t(firstOrder.priority)}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex justify-end items-center gap-2 mt-4 p-4">
            <Button variant="outline">
              <Edit className="h-4 w-4" />
              {t("edit")}
            </Button>
            <Button>{t("mark_as_ordered")}</Button>
          </div>
        </div>
        <div className="p-8 bg-white rounded-md shadow-md space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <p className="text-gray-500">
                <span className="text-sm">{t("po_number")}</span>
              </p>
              <p className="text-gray-500 flex flex-row items-end gap-1">
                <span className="text-black"> #Po-Supplier</span>
                <span className="text-gray-500 text-xs font-normal mb-1">
                  ({purchaseOrders.length} {t("items")})
                </span>
              </p>
            </div>
            <Button variant="outline">{t("download")}</Button>
          </div>
          <div className="rounded-md overflow-hidden border-2 border-white shadow-md">
            <Table>
              <TableHeader className="bg-gray-100">
                <TableRow className="divide-x">
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>{t("item_name")}</TableHead>
                  <TableHead>{t("qty_requested")}</TableHead>
                  <TableHead className="w-[50px]">{t("action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map(
                  (purchaseOrder: SupplyRequestRead, index: number) => (
                    <TableRow key={purchaseOrder.id} className="divide-x">
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{purchaseOrder.item.name}</TableCell>
                      <TableCell>{purchaseOrder.quantity}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Page>
  );
}
