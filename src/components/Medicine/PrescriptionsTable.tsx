import { useState } from "react";
import { useTranslation } from "react-i18next";

import RecordMeta from "@/CAREUI/display/RecordMeta";
import CareIcon from "@/CAREUI/icons/CareIcon";

import { Cancel } from "@/components/Common/ButtonV2";
import DialogModal from "@/components/Common/Dialog";
import PrescriptionDetailCard from "@/components/Medicine/PrescriptionDetailCard";
import ResponsiveMedicineTable from "@/components/Medicine/ResponsiveMedicineTables";
import { Prescription } from "@/components/Medicine/models";
import MedicineRoutes from "@/components/Medicine/routes";

import useSlug from "@/hooks/useSlug";

import useQuery from "@/Utils/request/useQuery";
import { formatDateTime } from "@/Utils/utils";

interface Props {
  is_prn?: boolean;
  prescription_type?: Prescription["prescription_type"];
}

export default function PrescriptionsTable({
  is_prn = false,
  prescription_type = "REGULAR",
}: Props) {
  const consultation = useSlug("consultation");
  const { t } = useTranslation();
  const [detailedViewFor, setDetailedViewFor] = useState<Prescription>();

  const { data } = useQuery(MedicineRoutes.listPrescriptions, {
    pathParams: { consultation },
    query: {
      dosage_type: is_prn ? "PRN" : "REGULAR,TITRATED",
      prescription_type,
      limit: 100,
    },
  });

  const lastModified = data?.results[0]?.modified_date;
  const tkeys =
    prescription_type === "REGULAR"
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
          <div className="text-secondary-600">
            <CareIcon icon="l-history-alt" className="pr-2" />
            <span className="text-xs">
              {lastModified && formatDateTime(lastModified)}
            </span>
          </div>
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
                  medicine: obj.medicine_object?.name ?? obj.medicine_old,
                  route__pretty:
                    obj.route && t("PRESCRIPTION_ROUTE_" + obj.route),
                  frequency__pretty:
                    obj.frequency &&
                    t("PRESCRIPTION_FREQUENCY_" + obj.frequency.toUpperCase()),
                  days__pretty: obj.days && obj.days + " day(s)",
                  min_hours_between_doses__pretty:
                    obj.min_hours_between_doses &&
                    obj.min_hours_between_doses + " hour(s)",
                  last_administered__pretty: obj.last_administration
                    ?.administered_date ? (
                    <RecordMeta
                      time={obj.last_administration?.administered_date}
                    />
                  ) : (
                    "never"
                  ),
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
};

const REGULAR_NORMAL_TKEYS = {
  ...COMMON_TKEYS,
  frequency: "frequency__pretty",
  days: "days__pretty",
  notes: "notes",
  last_administered: "last_administered__pretty",
};

const REGULAR_PRN_TKEYS = {
  ...COMMON_TKEYS,
  indicator: "indicator",
  max_dosage_24_hrs: "max_dosage",
  min_time_bw_doses: "min_hours_between_doses__pretty",
  notes: "notes",
  last_administered: "last_administered__pretty",
};

const DISCHARGE_NORMAL_TKEYS = {
  ...COMMON_TKEYS,
  frequency: "frequency__pretty",
  days: "days__pretty",
  notes: "notes",
};

const DISCHARGE_PRN_TKEYS = {
  ...COMMON_TKEYS,
  indicator: "indicator",
  max_dosage_24_hrs: "max_dosage",
  min_time_bw_doses: "min_hours_between_doses__pretty",
  notes: "notes",
};
