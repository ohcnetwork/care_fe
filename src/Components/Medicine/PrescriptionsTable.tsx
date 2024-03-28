import { useState } from "react";
import ResponsiveMedicineTable from "./ResponsiveMedicineTables";
import { formatDateTime } from "../../Utils/utils";
import { Prescription } from "./models";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ButtonV2, { Cancel, Submit } from "../Common/components/ButtonV2";
import SlideOver from "../../CAREUI/interactive/SlideOver";
import MedicineAdministration from "./MedicineAdministration";
import DiscontinuePrescription from "./DiscontinuePrescription";
import RecordMeta from "../../CAREUI/display/RecordMeta";
import AdministerMedicine from "./AdministerMedicine";
import DialogModal from "../Common/Dialog";
import PrescriptionDetailCard from "./PrescriptionDetailCard";
import { useTranslation } from "react-i18next";
import useSlug from "../../Common/hooks/useSlug";
import useQuery from "../../Utils/request/useQuery";
import MedicineRoutes from "./routes";

interface Props {
  is_prn?: boolean;
  prescription_type?: Prescription["prescription_type"];
  onChange?: () => void;
  readonly?: boolean;
}

export default function PrescriptionsTable({
  is_prn = false,
  prescription_type = "REGULAR",
  onChange,
  readonly,
}: Props) {
  const consultation = useSlug("consultation");
  const { t } = useTranslation();
  const [showBulkAdminister, setShowBulkAdminister] = useState(false);
  const [showDiscontinueFor, setShowDiscontinueFor] = useState<Prescription>();
  const [showAdministerFor, setShowAdministerFor] = useState<Prescription>();
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
      {data?.results && (
        <SlideOver
          title={t("administer_medicines")}
          dialogClass="w-full max-w-sm sm:max-w-md md:max-w-[1200px]"
          open={showBulkAdminister}
          setOpen={setShowBulkAdminister}
        >
          <MedicineAdministration
            prescriptions={data?.results}
            onDone={() => {
              setShowBulkAdminister(false);
              onChange?.();
            }}
          />
        </SlideOver>
      )}
      {showDiscontinueFor && (
        <DiscontinuePrescription
          prescription={showDiscontinueFor}
          onClose={(success) => {
            setShowDiscontinueFor(undefined);
            if (success) onChange?.();
          }}
          key={showDiscontinueFor.id}
        />
      )}
      {showAdministerFor && (
        <AdministerMedicine
          prescription={showAdministerFor}
          onClose={(success) => {
            setShowAdministerFor(undefined);
            if (success) onChange?.();
          }}
          key={showAdministerFor.id}
        />
      )}
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
              <Submit
                disabled={
                  detailedViewFor.discontinued ||
                  detailedViewFor.prescription_type === "DISCHARGE"
                }
                variant="danger"
                onClick={() => setShowDiscontinueFor(detailedViewFor)}
              >
                <CareIcon icon="l-ban" className="text-lg" />
                {t("discontinue")}
              </Submit>
              <Submit
                disabled={
                  detailedViewFor.discontinued ||
                  detailedViewFor.prescription_type === "DISCHARGE"
                }
                onClick={() => setShowAdministerFor(detailedViewFor)}
              >
                <CareIcon icon="l-syringe" className="text-lg" />
                {t("administer")}
              </Submit>
            </div>
          </div>
        </DialogModal>
      )}
      <div className="mb-2 flex flex-wrap items-center justify-between">
        <div className="flex items-center font-semibold leading-relaxed text-gray-900">
          <span className="mr-3 text-lg">
            {is_prn ? "PRN Prescriptions" : "Prescriptions"}
          </span>
          <div className="text-gray-600">
            <CareIcon icon="l-history-alt" className="pr-2" />
            <span className="text-xs">
              {lastModified && formatDateTime(lastModified)}
            </span>
          </div>
        </div>
        {prescription_type === "REGULAR" && (
          <div className="mt-2 flex w-full flex-col justify-end gap-2 sm:flex-row md:mt-0 md:w-auto">
            <ButtonV2
              disabled={readonly}
              variant="secondary"
              border
              href="prescriptions"
              className="w-full lg:w-auto"
            >
              <CareIcon icon="l-pen" className="text-lg" />
              <span className="hidden lg:block">{t("edit_prescriptions")}</span>
              <span className="block lg:hidden">{t("edit")}</span>
            </ButtonV2>
            <ButtonV2
              disabled={readonly}
              ghost
              border
              onClick={() => setShowBulkAdminister(true)}
              className="w-full lg:w-auto"
            >
              <CareIcon icon="l-syringe" className="text-lg" />
              <span className="hidden lg:block">
                {t("administer_medicines")}
              </span>
              <span className="block lg:hidden">{t("administer")}</span>
            </ButtonV2>
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto py-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="inline-block min-w-full overflow-hidden border-b border-gray-200 align-middle shadow sm:rounded-lg">
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
              actions={
                !readonly
                  ? (med: Prescription) => {
                      if (med.prescription_type === "DISCHARGE") {
                        return (
                          <div className="flex w-full items-center justify-center gap-1 font-medium text-gray-700">
                            <span className="text-sm">
                              {t("discharge_prescription")}
                            </span>
                          </div>
                        );
                      }

                      if (med.discontinued) {
                        return (
                          <div className="flex w-full items-center justify-center gap-1 font-medium text-gray-700">
                            <CareIcon icon="l-ban" />
                            <span className="text-sm">{t("discontinued")}</span>
                          </div>
                        );
                      }

                      return (
                        <div className="flex gap-1">
                          <ButtonV2
                            type="button"
                            size="small"
                            variant="secondary"
                            ghost
                            border
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowAdministerFor(med);
                            }}
                          >
                            <CareIcon icon="l-syringe" className="text-base" />
                            {t("administer")}
                          </ButtonV2>
                          <ButtonV2
                            type="button"
                            size="small"
                            variant="danger"
                            ghost
                            border
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDiscontinueFor(med);
                            }}
                          >
                            <CareIcon icon="l-ban" className="text-base" />
                            {t("discontinue")}
                          </ButtonV2>
                        </div>
                      );
                    }
                  : undefined
              }
            />
            {data?.results.length === 0 && (
              <div className="text-semibold flex items-center justify-center py-2 text-gray-600">
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
