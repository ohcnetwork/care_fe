import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useState } from "react";
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
import { DispenseButton } from "@/components/Consumable/DispenseButton";
import { EmptyState } from "@/components/ui/empty-state";

import { DosageInstructionList } from "@/components/Medicine/DosageInstructionList";
import { formatDosage, formatFrequency } from "@/components/Medicine/utils";

import { round } from "@/Utils/decimal";
import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";
import { InvoiceStatus } from "@/types/billing/invoice/invoice";
import {
  MEDICATION_DISPENSE_STATUS_COLORS,
  MedicationDispenseRead,
  MedicationDispenseStatus,
} from "@/types/emr/medicationDispense/medicationDispense";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";
import { Plus, TabletsIcon } from "lucide-react";

interface DispenseButtonSectionProps {
  canWrite: boolean;
  facilityId?: string;
  isDispenseOpen: boolean;
  setIsDispenseOpen: (open: boolean) => void;
}

function DispenseButtonSection({
  canWrite,
  facilityId,
  isDispenseOpen,
  setIsDispenseOpen,
}: DispenseButtonSectionProps) {
  const { t } = useTranslation();

  if (!canWrite) return null;

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button
          variant="outline"
          onClick={() => setIsDispenseOpen(true)}
          disabled={!facilityId}
        >
          <Plus className="mr-2" />
          {t("dispense")}
        </Button>
      </div>
      {facilityId && (
        <DispenseButton
          open={isDispenseOpen}
          setOpen={setIsDispenseOpen}
          facilityId={facilityId}
        />
      )}
    </>
  );
}

interface Props {
  patientId: string;
  encounterId: string;
  canAccess: boolean;
  canWrite: boolean;
  facilityId?: string;
  dispenseOrderId?: string;
}

export function DispenseHistory({
  patientId,
  encounterId,
  facilityId,
  canAccess,
  dispenseOrderId,
  canWrite,
}: Props) {
  const { t } = useTranslation();
  const [isDispenseOpen, setIsDispenseOpen] = useState(false);

  const { data: response, isLoading } = useQuery({
    queryKey: ["medication_dispense", dispenseOrderId, patientId, encounterId],
    queryFn: query(medicationDispenseApi.list, {
      queryParams: {
        encounter: encounterId,
        limit: 100,
        patient: patientId,
        order: dispenseOrderId,
      },
    }),
    enabled: !!patientId && canAccess && !!dispenseOrderId,
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
    return (
      <EmptyState
        icon={<TabletsIcon className="text-muted-foreground" />}
        title={t("no_dispense_history")}
        action={
          <DispenseButtonSection
            canWrite={canWrite}
            facilityId={facilityId}
            isDispenseOpen={isDispenseOpen}
            setIsDispenseOpen={setIsDispenseOpen}
          />
        }
        className="h-full"
      />
    );
  }

  return (
    <>
      <DispenseButtonSection
        canWrite={canWrite}
        facilityId={facilityId}
        isDispenseOpen={isDispenseOpen}
        setIsDispenseOpen={setIsDispenseOpen}
      />

      <div className="overflow-hidden rounded-md border-2 border-white shadow-md">
        <Table>
          <TableHeader className="bg-muted-background text-muted-foreground">
            <TableRow className="divide-x">
              <TableHead className="text-muted-foreground">
                {t("medicine")}
              </TableHead>
              <TableHead className="text-muted-foreground">
                {t("dosage")}
              </TableHead>
              <TableHead className="text-muted-foreground">
                {t("frequency")}
              </TableHead>
              <TableHead className="text-muted-foreground">
                {t("quantity")}
              </TableHead>
              <TableHead className="text-muted-foreground">
                {t("location")}
              </TableHead>
              <TableHead className="text-muted-foreground">
                {t("status")}
              </TableHead>
              <TableHead className="text-muted-foreground">
                {t("bill_time")}
              </TableHead>
              <TableHead className="text-muted-foreground">
                {t("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-background">
            {medications.map((medication: MedicationDispenseRead) => {
              const instructions = medication.dosage_instruction ?? [];

              return (
                <TableRow
                  key={medication.id}
                  className="hover:bg-soft-background divide-x"
                >
                  <TableCell className="text-foreground font-semibold">
                    {medication.item.product.product_knowledge.name}
                  </TableCell>
                  <TableCell className="text-foreground">
                    <DosageInstructionList
                      instructions={instructions}
                      renderItem={(di) => formatDosage(di) || "-"}
                    />
                  </TableCell>
                  <TableCell className="text-foreground">
                    <DosageInstructionList
                      instructions={instructions}
                      renderItem={(di) => formatFrequency(di) || "-"}
                    />
                  </TableCell>
                  <TableCell className="text-foreground font-medium">
                    {medication.quantity ? round(medication.quantity) : "-"}
                  </TableCell>
                  <TableCell className="text-foreground font-medium">
                    {medication.location.name}
                    {medication.location.id !== medication.item.location.id &&
                      ` (${medication.item.location.name})`}
                  </TableCell>
                  <TableCell className="text-foreground">
                    <Badge
                      variant={
                        MEDICATION_DISPENSE_STATUS_COLORS[medication.status]
                      }
                    >
                      {t(medication.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground">
                    {formatDateTime(
                      medication.when_prepared.toString(),
                      "hh:mm A, DD/MM/YYYY",
                    )}
                  </TableCell>
                  <TableCell>
                    {medication.status !==
                      MedicationDispenseStatus.completed && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        hidden={!facilityId}
                      >
                        <Link
                          href={`/facility/${facilityId}/locations/${medication.location.id}/medication_dispense/${dispenseOrderId ? `order/${dispenseOrderId}/?status=${medication.status}&payment_status=${medication.charge_item?.paid_invoice?.status === InvoiceStatus.balanced ? "paid" : "unpaid"}` : ""}`}
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
    </>
  );
}
