import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
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

import Loading from "@/components/Common/Loading";
import { EmptyState } from "@/components/Medicine/MedicationRequestTable";

import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";
import { InvoiceStatus } from "@/types/billing/invoice/invoice";
import {
  MEDICATION_DISPENSE_STATUS_COLORS,
  MedicationDispenseRead,
  MedicationDispenseStatus,
} from "@/types/emr/medicationDispense/medicationDispense";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";

interface Props {
  patientId: string;
  encounterId: string;
  canAccess: boolean;
  facilityId?: string;
}

export function DispenseHistory({
  patientId,
  encounterId,
  facilityId,
  canAccess,
}: Props) {
  const { t } = useTranslation();

  const { data: response, isLoading } = useQuery({
    queryKey: ["medication_dispense", patientId],
    queryFn: query(medicationDispenseApi.list, {
      queryParams: {
        encounter: encounterId,
        limit: 100,
        patient: patientId,
      },
    }),
    enabled: !!patientId && canAccess,
  });

  const medications = response?.results || [];

  if (isLoading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!medications.length) {
    return <EmptyState message={t("no_dispense_history")} />;
  }

  return (
    <div className="overflow-hidden rounded-md border-2 border-white shadow-md">
      <Table>
        <TableHeader className="bg-gray-100 text-gray-700">
          <TableRow className="divide-x">
            <TableHead className="text-gray-700">{t("medicine")}</TableHead>
            <TableHead className="text-gray-700">{t("dosage")}</TableHead>
            <TableHead className="text-gray-700">{t("frequency")}</TableHead>
            <TableHead className="text-gray-700">{t("quantity")}</TableHead>
            <TableHead className="text-gray-700">{t("location")}</TableHead>
            <TableHead className="text-gray-700">{t("status")}</TableHead>
            <TableHead className="text-gray-700">{t("bill_time")}</TableHead>
            <TableHead className="text-gray-700">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">
          {medications.map((medication: MedicationDispenseRead) => {
            const instruction = medication.dosage_instruction[0] ?? {};
            const frequency = instruction?.timing?.code;
            const dosage = instruction?.dose_and_rate?.dose_quantity;

            return (
              <TableRow
                key={medication.id}
                className="hover:bg-gray-50 divide-x"
              >
                <TableCell className="text-gray-950 font-semibold">
                  {medication.item.product.product_knowledge.name}
                </TableCell>
                <TableCell className="text-gray-950">
                  {dosage ? `${dosage.value} ${dosage.unit.display}` : "-"}
                </TableCell>
                <TableCell className="text-gray-950">
                  {instruction?.as_needed_boolean
                    ? `${t("as_needed_prn")} ${
                        instruction?.as_needed_for?.display
                          ? `(${instruction.as_needed_for.display})`
                          : ""
                      }`
                    : frequency?.display || "-"}
                </TableCell>
                <TableCell className="text-gray-950 font-medium">
                  {medication.quantity || "-"}
                </TableCell>
                <TableCell className="text-gray-950 font-medium">
                  {medication.location.name}
                  {medication.location.id !== medication.item.location.id &&
                    ` (${medication.item.location.name})`}
                </TableCell>
                <TableCell className="text-gray-950">
                  <Badge
                    variant={
                      MEDICATION_DISPENSE_STATUS_COLORS[medication.status]
                    }
                  >
                    {t(medication.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-950">
                  {formatDateTime(
                    medication.when_prepared.toString(),
                    "hh:mm A, DD/MM/YYYY",
                  )}
                </TableCell>
                <TableCell>
                  {medication.status !== MedicationDispenseStatus.completed && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      disabled={!facilityId}
                    >
                      <Link
                        href={`/facility/${facilityId}/locations/${medication.location.id}/medication_dispense/patient/${patientId}/${medication.status}?payment_status=${medication.charge_item?.paid_invoice?.status === InvoiceStatus.balanced ? "paid" : "unpaid"}`}
                      >
                        {t("dispense")}
                      </Link>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
