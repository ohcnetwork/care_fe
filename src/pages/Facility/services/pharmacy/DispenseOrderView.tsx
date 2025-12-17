import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MoreVertical, PrinterIcon } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Common/Table";
import { PatientHeader } from "@/components/Patient/PatientHeader";

import CareIcon from "@/CAREUI/icons/CareIcon";

import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import {
  DispenseOrderRead,
  DispenseOrderStatus,
} from "@/types/emr/dispenseOrder/dispenseOrder";
import dispenseOrderApi from "@/types/emr/dispenseOrder/dispenseOrderApi";
import {
  MEDICATION_DISPENSE_STATUS_COLORS,
  MedicationDispenseRead,
} from "@/types/emr/medicationDispense/medicationDispense";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";
import patientApi from "@/types/emr/patient/patientApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";
import { toast } from "sonner";

const DISPENSE_ORDER_STATUS_STYLES: Record<
  DispenseOrderStatus,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  [DispenseOrderStatus.draft]: "secondary",
  [DispenseOrderStatus.in_progress]: "yellow",
  [DispenseOrderStatus.completed]: "green",
  [DispenseOrderStatus.abandoned]: "secondary",
  [DispenseOrderStatus.entered_in_error]: "danger",
};

interface Props {
  facilityId: string;
  dispenseOrderId: string;
}

export default function DispenseOrderView({
  facilityId,
  dispenseOrderId,
}: Props) {
  const { t } = useTranslation();
  const { locationId } = useCurrentLocation();
  const queryClient = useQueryClient();
  const [orderToUpdate, setOrderToUpdate] = useState<{
    order: DispenseOrderRead;
    newStatus: DispenseOrderStatus;
  } | null>(null);

  const { data: dispenseOrder, isLoading } = useQuery({
    queryKey: ["dispenseOrder", facilityId, dispenseOrderId],
    queryFn: query(dispenseOrderApi.get, {
      pathParams: { facilityId, id: dispenseOrderId },
    }),
  });

  const { data: patientData } = useQuery({
    queryKey: ["patient", dispenseOrder?.patient.id],
    queryFn: query(patientApi.get, {
      pathParams: { id: dispenseOrder?.patient.id ?? "" },
      silent: true,
    }),
    enabled: !!dispenseOrder?.patient.id,
  });

  const { data: medicationDispenses, isLoading: isLoadingDispenses } = useQuery(
    {
      queryKey: ["medicationDispenses", dispenseOrderId, locationId],
      queryFn: query(medicationDispenseApi.list, {
        queryParams: {
          order: dispenseOrderId,
          location: locationId,
        },
      }),
      enabled: !!dispenseOrderId,
    },
  );

  const { mutate: updateDispenseOrderStatus } = useMutation({
    mutationFn: ({
      order,
      newStatus,
    }: {
      order: DispenseOrderRead;
      newStatus: DispenseOrderStatus;
    }) => {
      return mutate(dispenseOrderApi.update, {
        pathParams: { facilityId, id: order.id },
      })({ status: newStatus, name: order?.name, note: order?.note });
    },
    onSuccess: () => {
      toast.success(t("dispense_order_status_updated_successfully"));
      queryClient.invalidateQueries({
        queryKey: ["dispenseOrder", facilityId, dispenseOrderId],
      });
      queryClient.invalidateQueries({
        queryKey: ["dispenseOrderQueue", facilityId],
      });
    },
    onError: () => {
      toast.error(t("something_went_wrong"));
    },
  });

  if (isLoading || !dispenseOrder) {
    return <TableSkeleton count={5} />;
  }

  return (
    <Page title={t("dispense_order")} hideTitleOnPage>
      <div>
        <Button
          data-shortcut-id="go-back"
          variant="outline"
          className="text-gray-950 font-semibold border-gray-300 mb-4"
          size="sm"
          onClick={() =>
            navigate(
              `/facility/${facilityId}/locations/${locationId}/dispense_orders/`,
            )
          }
        >
          <ArrowLeft />
          {t("back_to_dispense_queue")}
        </Button>
      </div>

      {patientData && (
        <PatientHeader
          patient={patientData}
          facilityId={facilityId}
          className="p-2 rounded-none shadow-none bg-gray-100"
        />
      )}

      <div className="mt-4">
        <div className="space-y-4">
          {/* Order Header */}
          <div className="bg-white border rounded-md p-4">
            <div className="flex md:flex-row flex-col items-start md:items-center justify-between gap-4">
              <div className="flex flex-row gap-2">
                <h2 className="text-xl font-semibold text-gray-900">
                  {dispenseOrder.name}
                </h2>
                {dispenseOrder.note && (
                  <p className="text-sm text-gray-600">{dispenseOrder.note}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-700">
                  <div>
                    <span className="text-gray-500">{t("created_at")}:</span>{" "}
                    <span className="font-medium">
                      {formatDateTime(dispenseOrder.patient.created_date)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t("location")}:</span>{" "}
                    <span className="font-medium">
                      {dispenseOrder.location.name}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={DISPENSE_ORDER_STATUS_STYLES[dispenseOrder.status]}
                >
                  {t("status")}:{" "}
                  {t(`dispense_order_status__${dispenseOrder.status}`)}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-gray-300 shadow-none"
                      size="icon"
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {dispenseOrder.status === DispenseOrderStatus.draft && (
                      <DropdownMenuItem
                        onSelect={() => {
                          setOrderToUpdate({
                            order: dispenseOrder,
                            newStatus: DispenseOrderStatus.in_progress,
                          });
                        }}
                      >
                        {t("mark_as_in_progress")}
                      </DropdownMenuItem>
                    )}
                    {(dispenseOrder.status === DispenseOrderStatus.draft ||
                      dispenseOrder.status ===
                        DispenseOrderStatus.in_progress) && (
                      <DropdownMenuItem
                        onSelect={() => {
                          setOrderToUpdate({
                            order: dispenseOrder,
                            newStatus: DispenseOrderStatus.completed,
                          });
                        }}
                      >
                        {t("mark_as_completed")}
                      </DropdownMenuItem>
                    )}
                    {(dispenseOrder.status === DispenseOrderStatus.draft ||
                      dispenseOrder.status ===
                        DispenseOrderStatus.in_progress) && (
                      <DropdownMenuItem
                        onSelect={() => {
                          setOrderToUpdate({
                            order: dispenseOrder,
                            newStatus: DispenseOrderStatus.abandoned,
                          });
                        }}
                      >
                        {t("mark_as_abandoned")}
                      </DropdownMenuItem>
                    )}
                    {dispenseOrder.status === DispenseOrderStatus.completed && (
                      <DropdownMenuItem
                        onSelect={() => {
                          setOrderToUpdate({
                            order: dispenseOrder,
                            newStatus: DispenseOrderStatus.in_progress,
                          });
                        }}
                      >
                        {t("reopen_order")}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  className="border-gray-400 font-semibold"
                  disabled={!medicationDispenses?.results?.length}
                  onClick={() =>
                    navigate(
                      `/facility/${facilityId}/locations/${locationId}/dispense_orders/${dispenseOrderId}/print`,
                    )
                  }
                >
                  <PrinterIcon className="size-4" />
                  {t("print")}
                </Button>
              </div>
            </div>
          </div>

          {/* Medication Dispenses */}
          <div className="bg-white border rounded-md">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("medication_dispenses")}
              </h3>
            </div>
            {isLoadingDispenses ? (
              <div className="p-4">
                <TableSkeleton count={3} />
              </div>
            ) : medicationDispenses?.results?.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={
                    <CareIcon
                      icon="l-prescription-bottle"
                      className="text-primary size-6"
                    />
                  }
                  title={t("no_medication_dispenses_found")}
                  description={t("no_medication_dispenses_found_description")}
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("medicine")}</TableHead>
                    <TableHead>{t("dosage")}</TableHead>
                    <TableHead>{t("frequency")}</TableHead>
                    <TableHead>{t("quantity")}</TableHead>
                    <TableHead>{t("item_location")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("prepared_date")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicationDispenses?.results?.map(
                    (dispense: MedicationDispenseRead) => {
                      const instruction = dispense.dosage_instruction[0] ?? {};
                      const frequency = instruction?.timing?.code;
                      const dosage = instruction?.dose_and_rate?.dose_quantity;

                      return (
                        <TableRow key={dispense.id}>
                          <TableCell className="font-semibold">
                            {dispense.item.product.product_knowledge.name}
                            {dispense.note && (
                              <div className="text-xs text-gray-500">
                                {dispense.note}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {dosage
                              ? `${dosage.value} ${dosage.unit.display}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {instruction?.as_needed_boolean
                              ? `${t("as_needed_prn")} ${
                                  instruction?.as_needed_for?.display
                                    ? `(${instruction.as_needed_for.display})`
                                    : ""
                                }`
                              : frequency?.display || "-"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {dispense.quantity || "-"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {dispense.item.location.name || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                MEDICATION_DISPENSE_STATUS_COLORS[
                                  dispense.status
                                ]
                              }
                            >
                              {t(
                                `medication_dispense_status__${dispense.status}`,
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(
                              dispense.when_prepared,
                            ).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      );
                    },
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Status Update Dialog */}
      <ConfirmActionDialog
        open={orderToUpdate !== null}
        onOpenChange={(open) => {
          if (!open) setOrderToUpdate(null);
        }}
        title={t("update_status")}
        description={
          <>
            <Trans
              i18nKey="confirm_action_description"
              values={{
                action: t("change_status").toLowerCase(),
              }}
              components={{
                1: <strong className="text-gray-900" />,
              }}
            />{" "}
            {t("you_cannot_change_once_submitted")}
            <p className="mt-2">
              {t("dispense_order")}:{" "}
              <strong>
                {orderToUpdate?.order?.name || t("dispense_order")}
              </strong>
            </p>
            <p className="mt-1">
              {t("new_status")}:{" "}
              <strong>
                {orderToUpdate?.newStatus
                  ? t(`dispense_order_status__${orderToUpdate.newStatus}`)
                  : ""}
              </strong>
            </p>
          </>
        }
        onConfirm={() => {
          if (orderToUpdate) {
            updateDispenseOrderStatus(orderToUpdate);
          }
          setOrderToUpdate(null);
        }}
        confirmText={t("update_status")}
        cancelText={t("cancel")}
        variant="primary"
      />
    </Page>
  );
}
