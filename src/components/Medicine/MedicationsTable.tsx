import { EyeIcon, EyeOffIcon } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  displayMedicationName,
  INACTIVE_MEDICATION_STATUSES,
  MedicationRequestRead,
} from "@/types/emr/medicationRequest/medicationRequest";

import { DosageInstructionList } from "./DosageInstructionList";
import {
  formatDosage,
  formatDuration,
  formatFrequency,
  formatSig,
} from "./utils";

interface MedicationsTableProps {
  medications: MedicationRequestRead[];
  showActiveOnly?: boolean;
}

export const MedicationsTable = ({
  medications,
  showActiveOnly = true,
}: MedicationsTableProps) => {
  const { t } = useTranslation();
  const [showInactive, setShowInactive] = React.useState(false);

  const { activeMedications, inactiveMedications } = React.useMemo(() => {
    const active = medications.filter(
      (med: MedicationRequestRead) =>
        !INACTIVE_MEDICATION_STATUSES.includes(
          med.status as (typeof INACTIVE_MEDICATION_STATUSES)[number],
        ),
    );
    const inactive = medications.filter((med: MedicationRequestRead) =>
      INACTIVE_MEDICATION_STATUSES.includes(
        med.status as (typeof INACTIVE_MEDICATION_STATUSES)[number],
      ),
    );
    return { activeMedications: active, inactiveMedications: inactive };
  }, [medications]);

  if (!medications.length) {
    return (
      <CardContent className="p-2">
        <p className="text-gray-500 w-full flex justify-center mb-3">
          {t("no_active_medication_recorded")}
        </p>
      </CardContent>
    );
  }

  return (
    <div className=" @container border border-gray-200 rounded-lg">
      <Table className="@lg:min-w-auto min-w-6xl">
        <TableHeader>
          <TableRow className="divide-x bg-gray-100">
            <TableHead>{t("medicine")}</TableHead>
            <TableHead>{t("dosage")}</TableHead>
            <TableHead>{t("frequency")}</TableHead>
            <TableHead>{t("duration")}</TableHead>
            <TableHead>{t("instructions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(showInactive ? medications : activeMedications).map(
            (medication: MedicationRequestRead) => {
              const instructions = medication.dosage_instruction;
              const notes = medication.note;
              const isInactive = INACTIVE_MEDICATION_STATUSES.includes(
                medication.status as (typeof INACTIVE_MEDICATION_STATUSES)[number],
              );

              return (
                <TableRow
                  key={medication.id}
                  className={cn(
                    "divide-x font-medium",
                    isInactive && "opacity-40",
                    isInactive &&
                      medication.status !== "ended" &&
                      "line-through",
                  )}
                >
                  <TableCell className="py-2 px-3 break-words whitespace-normal">
                    {displayMedicationName(medication)}
                  </TableCell>
                  <TableCell className="py-2 px-3 break-words whitespace-normal">
                    <DosageInstructionList
                      instructions={instructions}
                      renderItem={(di) => formatDosage(di) || "-"}
                    />
                  </TableCell>
                  <TableCell className="py-2 px-3 break-words whitespace-normal">
                    <DosageInstructionList
                      instructions={instructions}
                      renderItem={(di) => {
                        const freq = formatFrequency(di);
                        const additionalInstr = di.additional_instruction ?? [];
                        return (
                          <>
                            {freq || "-"}
                            {additionalInstr.length > 0 && (
                              <div className="text-sm text-gray-600 space-y-1">
                                {additionalInstr.map(
                                  (item: { display: string }, aIdx: number) => (
                                    <div key={aIdx}>{item.display}</div>
                                  ),
                                )}
                              </div>
                            )}
                          </>
                        );
                      }}
                    />
                  </TableCell>
                  <TableCell className="py-2 px-3 break-words whitespace-normal">
                    <DosageInstructionList
                      instructions={instructions}
                      renderItem={(di) => formatDuration(di) || "-"}
                    />
                  </TableCell>
                  <TableCell className="py-2 px-3 break-words whitespace-normal">
                    <DosageInstructionList
                      instructions={instructions}
                      renderItem={(di) => (
                        <>
                          {formatSig(di) || "-"}
                          {notes && (
                            <div className="text-sm text-gray-600">{notes}</div>
                          )}
                        </>
                      )}
                    />
                  </TableCell>
                </TableRow>
              );
            },
          )}
        </TableBody>
      </Table>
      {!showActiveOnly && !!inactiveMedications.length && (
        <div
          className="flex items-center gap-2 p-4 cursor-pointer hover:bg-gray-50 border-t"
          onClick={() => setShowInactive(!showInactive)}
        >
          {showInactive ? (
            <EyeOffIcon className="size-4 text-gray-500" />
          ) : (
            <EyeIcon className="size-4 text-gray-500" />
          )}
          <span className="text-sm text-gray-700">
            {showInactive ? t("hide") : t("show")}{" "}
            {`${inactiveMedications.length} ${t("inactive")}`}{" "}
            {t("medications")}
          </span>
        </div>
      )}
    </div>
  );
};
