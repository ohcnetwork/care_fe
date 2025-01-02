import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Cancel } from "@/components/Common/ButtonV2";
import DialogModal from "@/components/Common/Dialog";
import PrescriptionDetailCard from "@/components/Medicine/PrescriptionDetailCard";
import ResponsiveMedicineTable from "@/components/Medicine/ResponsiveMedicineTables";

import useSlug from "@/hooks/useSlug";

import routes from "@/Utils/request/api";
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import { displayCode, displayDoseRange, displayTiming } from "@/Utils/utils";
import { MedicationRequest } from "@/types/emr/medicationRequest";

import { useEncounter } from "../Facility/ConsultationDetails/EncounterContext";

interface Props {
  is_prn?: boolean;
  category?: MedicationRequest["category"];
}

export default function PrescriptionsTable({
  is_prn = false,
  category = "inpatient",
}: Props) {
  const encounterId = useSlug("encounter");
  const { patient } = useEncounter();
  const { t } = useTranslation();
  const [detailedViewFor, setDetailedViewFor] = useState<MedicationRequest>();

  const { data } = useTanStackQueryInstead(routes.medicationRequest.list, {
    pathParams: { patientId: patient!.id },
    query: {
      is_prn,
      category,
      encounter: encounterId,
      limit: 100,
    },
  });

  const tkeys =
    category === "inpatient"
      ? is_prn
        ? REGULAR_PRN_TKEYS
        : REGULAR_NORMAL_TKEYS
      : is_prn
        ? DISCHARGE_PRN_TKEYS
        : DISCHARGE_NORMAL_TKEYS;

  return (
    <div>
      {detailedViewFor && (
        <DialogModal
          onClose={() => setDetailedViewFor(undefined)}
          title={t("prescription_details")}
          className="w-full md:max-w-4xl"
          show
        >
          <div className="mt-4 flex flex-col gap-4">
            <PrescriptionDetailCard
              prescription={detailedViewFor}
              key={detailedViewFor.id}
              readonly
            />
            <div className="flex w-full flex-col items-center justify-end gap-2 md:flex-row">
              <Cancel
                onClick={() => setDetailedViewFor(undefined)}
                label={t("close")}
              />
            </div>
          </div>
        </DialogModal>
      )}
      <div className="mb-2 flex flex-wrap items-center justify-between">
        <div className="flex items-center font-semibold leading-relaxed text-secondary-900">
          <span className="mr-3 text-lg">
            {is_prn ? "PRN Prescriptions" : "Prescriptions"}
          </span>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto py-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="inline-block min-w-full overflow-hidden border-b border-secondary-200 align-middle shadow sm:rounded-lg">
            <ResponsiveMedicineTable
              onClick={setDetailedViewFor}
              maxWidthColumn={0}
              theads={Object.keys(tkeys).map((_) => t(_))}
              list={
                data?.results.map((obj) => ({
                  ...obj,
                  medicine: displayCode(obj.medication),
                  route__pretty:
                    obj.dosage_instruction[0].route &&
                    displayCode(obj.dosage_instruction[0].route),
                  frequency__pretty:
                    obj.dosage_instruction[0].timing &&
                    displayTiming(obj.dosage_instruction[0].timing),
                  max_dose_per_period__pretty:
                    obj.dosage_instruction[0].max_dose_per_period &&
                    displayDoseRange(
                      obj.dosage_instruction[0].max_dose_per_period,
                    ),
                  indicator:
                    obj.dosage_instruction[0].as_needed_for &&
                    displayCode(obj.dosage_instruction[0].as_needed_for),
                })) || []
              }
              objectKeys={Object.values(tkeys)}
              fieldsToDisplay={[2, 3]}
            />
            {data?.results.length === 0 && (
              <div className="text-semibold flex items-center justify-center py-2 text-secondary-600">
                {t("no_data_found")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const COMMON_TKEYS = {
  medicine: "medicine",
  route: "route__pretty",
  base_dosage: "base_dosage",
  notes: "note",
};

const REGULAR_NORMAL_TKEYS = {
  ...COMMON_TKEYS,
  frequency: "frequency__pretty",
};

const REGULAR_PRN_TKEYS = {
  ...COMMON_TKEYS,
  indicator: "indicator",
  max_dose_per_period__pretty: "max_dose_per_period__pretty",
};

const DISCHARGE_NORMAL_TKEYS = {
  ...COMMON_TKEYS,
  frequency: "frequency__pretty",
};

const DISCHARGE_PRN_TKEYS = {
  ...COMMON_TKEYS,
  indicator: "indicator",
  max_dose_per_period__pretty: "max_dose_per_period__pretty",
};
