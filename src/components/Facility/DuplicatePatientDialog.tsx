import { useState } from "react";
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
  handleOk: (action: string) => void;
}

const DuplicatePatientDialog = (props: Props) => {
  const { t } = useTranslation();
  const { open, onOpenChange, patientList, handleOk } = props;
  const [action, setAction] = useState("");

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
            <div className="mb-2 flex items-center">
              <label
                className="mb-2 ml-0 flex w-full rounded-md bg-primary-500 py-2 pr-2 text-white"
                htmlFor="transfer"
              >
                <input
                  type="radio"
                  className="m-3 text-green-600 focus:ring-2 focus:ring-green-500"
                  id="transfer"
                  name="confirm_action"
                  value="transfer"
                  onChange={(e) => setAction(e.target.value)}
                />
                <p>{t("duplicate_patient_record_confirmation")}</p>
              </label>
            </div>

            <div className="mb-2 flex items-center">
              <label
                className="mb-2 ml-0 flex w-full rounded-md bg-red-500 py-2 pr-2 text-white"
                htmlFor="close"
              >
                <input
                  type="radio"
                  id="close"
                  className="m-3 text-red-600 focus:ring-2 focus:ring-red-500"
                  name="confirm_action"
                  value="close"
                  onChange={(e) => setAction(e.target.value)}
                />
                <p>{t("duplicate_patient_record_rejection")}</p>
              </label>
            </div>

            <p>{t("duplicate_patient_record_birth_unknown")}</p>
          </div>
        </div>
        <DialogFooter>
          <div className="mt-4 flex flex-col justify-between sm:flex-row gap-2">
            <Button
              onClick={() => handleOk(action)}
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
