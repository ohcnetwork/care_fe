import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { PartialPatientModel, PatientRead } from "@/types/emr/patient/patient";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientList: Array<PartialPatientModel | PatientRead>;
  onTransfer: () => void;
}

const DuplicatePatientDialog = ({
  open,
  onOpenChange,
  patientList,
  onTransfer,
}: Props) => {
  const { t } = useTranslation();
  const [action, setAction] = useState<"transfer" | "close">();
  const groupId = useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="[&>button:last-child]:hidden w-3/4 md:w-1/2 max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{t("patient_records_found")}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <p className="text-sm leading-relaxed">
              {t("patient_records_found_description")}(
              <span className="font-bold">
                {formatPhoneNumberIntl(patientList[0].phone_number)}
              </span>
              )
            </p>
          </div>
          <div>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {[`${t("patient_name")} / ID`, t("gender")].map(
                      (heading, i) => (
                        <TableHead key={i}>{heading}</TableHead>
                      ),
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patientList.map((patient, i) => {
                    return (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="font-semibold capitalize">
                            {patient.name}
                          </div>
                          <div className="break-words text-xs">
                            ID : {patient.id}
                          </div>
                        </TableCell>
                        <TableCell>{patient.gender}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="flex flex-col">
            <RadioGroup<"transfer" | "close">
              value={action ?? ""}
              onValueChange={setAction}
              aria-label={t("patient_records_found")}
              className="mb-3"
            >
              <FieldLabel htmlFor={`${groupId}-transfer`}>
                <Field orientation="horizontal">
                  <RadioGroupItem id={`${groupId}-transfer`} value="transfer" />
                  <FieldContent>
                    <FieldTitle>
                      {t("duplicate_patient_record_confirmation")}
                    </FieldTitle>
                  </FieldContent>
                </Field>
              </FieldLabel>
              <FieldLabel htmlFor={`${groupId}-close`}>
                <Field orientation="horizontal">
                  <RadioGroupItem id={`${groupId}-close`} value="close" />
                  <FieldContent>
                    <FieldTitle>
                      {t("duplicate_patient_record_rejection")}
                    </FieldTitle>
                  </FieldContent>
                </Field>
              </FieldLabel>
            </RadioGroup>

            <p>{t("duplicate_patient_record_birth_unknown")}</p>
          </div>
        </div>
        <DialogFooter>
          <div className="mt-4 flex flex-col justify-between sm:flex-row gap-2">
            <Button
              onClick={() =>
                action === "transfer" ? onTransfer() : onOpenChange(false)
              }
              disabled={!action}
              variant={"primary"}
            >
              <CareIcon icon="l-check" className="text-lg mr-1" />
              {t("continue")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicatePatientDialog;
