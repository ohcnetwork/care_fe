import { useQuery } from "@tanstack/react-query";
import { formatDate } from "date-fns";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  MEDICATION_DISPENSE_STATUS_COLORS,
  MedicationDispenseRead,
} from "@/types/emr/medicationDispense/medicationDispense";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";
import { round } from "@/Utils/decimal";
import query from "@/Utils/request/query";

interface DispensedItemsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicationRequestId: string;
}

export function DispensedItemsSheet({
  open,
  onOpenChange,
  medicationRequestId,
}: DispensedItemsSheetProps) {
  const { t } = useTranslation();
  const { facilityId } = useCurrentFacility();
  const { locationId } = useCurrentLocation();

  const { qParams, Pagination, resultsPerPage } = useFilters({
    limit: 10,
    disableCache: true,
  });

  const { data: dispensedItems, isLoading } = useQuery({
    queryKey: ["medication_dispense", medicationRequestId, qParams],
    queryFn: query(medicationDispenseApi.list, {
      queryParams: {
        authorizing_request: medicationRequestId,
        facility: facilityId,
        location: locationId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
      },
    }),
    enabled: open && !!medicationRequestId,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>{t("dispensed_items")}</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          {isLoading ? (
            <TableSkeleton count={3} />
          ) : dispensedItems?.results.length ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("item")}</TableHead>
                    <TableHead>{t("quantity")}</TableHead>
                    <TableHead>{t("lot_number")}</TableHead>
                    <TableHead>{t("dispensed_on")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("total_price")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispensedItems?.results.map(
                    (item: MedicationDispenseRead) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.item.product.product_knowledge.name}
                        </TableCell>
                        <TableCell>
                          {round(item.charge_item.quantity)}{" "}
                          {
                            item.dosage_instruction?.[0]?.dose_and_rate
                              ?.dose_quantity?.unit?.display
                          }
                        </TableCell>
                        <TableCell>
                          {item.item.product.batch?.lot_number || "-"}
                        </TableCell>
                        <TableCell>
                          {formatDate(
                            new Date(item.when_prepared),
                            "dd/MM/yyyy hh:mm a",
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              MEDICATION_DISPENSE_STATUS_COLORS[item.status]
                            }
                          >
                            {t(item.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <MonetaryDisplay
                            amount={item?.charge_item?.total_price}
                          />
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
              {dispensedItems.count > resultsPerPage && (
                <div className="mt-4 flex justify-center">
                  <Pagination totalCount={dispensedItems.count} />
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-gray-500">
              {t("no_items_dispensed_yet")}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
