import { useTranslation } from "react-i18next";
import { Prescription } from "../models";
import { useState } from "react";
import useQuery from "../../../Utils/request/useQuery";
import MedicineRoutes from "../routes";
import { classNames, formatDateTime } from "../../../Utils/utils";
import useSlug from "../../../Common/hooks/useSlug";
import DiscontinuePrescription from "../DiscontinuePrescription";
import AdministerMedicine from "../AdministerMedicine";
import DialogModal from "../../Common/Dialog";
import PrescriptionDetailCard from "../PrescriptionDetailCard";
import ButtonV2, { Cancel, Submit } from "../../Common/components/ButtonV2";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import EditPrescriptionForm from "../EditPrescriptionForm";
import AdministrationEventSeperator from "./AdministrationEventSeperator";
import AdministrationEventCell from "./AdministrationEventCell";

interface Props {
  prescription: Prescription;
  intervals: { start: Date; end: Date }[];
  refetch: () => void;
}

export default function MedicineAdministrationTableRow({
  prescription,
  ...props
}: Props) {
  const { t } = useTranslation();
  const consultation = useSlug("consultation");
  // const [showActions, setShowActions] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAdminister, setShowAdminister] = useState(false);
  const [showDiscontinue, setShowDiscontinue] = useState(false);

  const { data, loading, refetch } = useQuery(
    MedicineRoutes.listAdministrations,
    {
      pathParams: { consultation },
      query: {
        prescription: prescription.id,
        administered_date_after: formatDateTime(
          props.intervals[0].start,
          "YYYY-MM-DD"
        ),
        administered_date_before: formatDateTime(
          props.intervals[props.intervals.length - 1].end,
          "YYYY-MM-DD"
        ),
        archived: false,
      },
      key: `${prescription.last_administration?.administered_date}`,
    }
  );

  return (
    <tr
      className={classNames(
        "group transition-all duration-200 ease-in-out",
        loading ? "bg-gray-300" : "bg-white hover:bg-primary-100"
      )}
    >
      {showDiscontinue && (
        <DiscontinuePrescription
          prescription={prescription}
          onClose={(success) => {
            setShowDiscontinue(false);
            if (success) {
              props.refetch();
            }
          }}
        />
      )}
      {showAdminister && (
        <AdministerMedicine
          prescription={prescription}
          onClose={(success) => {
            setShowAdminister(false);
            if (success) {
              props.refetch();
            }
          }}
        />
      )}
      {showDetails && (
        <DialogModal
          title={t("prescription_details")}
          onClose={() => setShowDetails(false)}
          className="w-full md:max-w-4xl"
          show
        >
          <div className="mt-4 flex flex-col gap-4">
            <PrescriptionDetailCard prescription={prescription} readonly />
            <div className="flex w-full flex-col items-center justify-end gap-2 md:flex-row">
              <Cancel
                onClick={() => setShowDetails(false)}
                label={t("close")}
              />
              <Submit
                disabled={
                  prescription.discontinued ||
                  prescription.prescription_type === "DISCHARGE"
                }
                variant="danger"
                onClick={() => setShowDiscontinue(true)}
              >
                <CareIcon icon="l-ban" className="text-lg" />
                {t("discontinue")}
              </Submit>
              <Submit
                disabled={
                  prescription.discontinued ||
                  prescription.prescription_type === "DISCHARGE"
                }
                variant="secondary"
                border
                onClick={() => {
                  setShowDetails(false);
                  setShowEdit(true);
                }}
              >
                <CareIcon icon="l-pen" className="text-lg" />
                {t("edit")}
              </Submit>
              <Submit
                disabled={
                  prescription.discontinued ||
                  prescription.prescription_type === "DISCHARGE"
                }
                onClick={() => setShowAdminister(true)}
              >
                <CareIcon className="care-l-syringe text-lg" />
                {t("administer")}
              </Submit>
            </div>
          </div>
        </DialogModal>
      )}
      {showEdit && (
        <DialogModal
          onClose={() => setShowEdit(false)}
          show={showEdit}
          title={`${t("edit")} ${t(
            prescription.dosage_type === "PRN"
              ? "prn_prescription"
              : "prescription_medication"
          )}: ${
            prescription.medicine_object?.name ?? prescription.medicine_old
          }`}
          description={
            <div className="mt-2 flex w-full justify-start gap-2 text-warning-500">
              <CareIcon icon="l-info-circle" className="text-base" />
              <span>{t("edit_caution_note")}</span>
            </div>
          }
          className="w-full max-w-3xl lg:min-w-[600px]"
        >
          <EditPrescriptionForm
            initial={prescription}
            onDone={(success) => {
              setShowEdit(false);
              if (success) {
                props.refetch();
              }
            }}
          />
        </DialogModal>
      )}
      <td
        className="bg-gray-white sticky left-0 z-10 cursor-pointer bg-white py-3 pl-4 text-left transition-all duration-200 ease-in-out group-hover:bg-primary-100"
        onClick={() => setShowDetails(true)}
      >
        <div className="flex flex-col gap-1 lg:flex-row lg:justify-between lg:gap-2">
          <div className="flex items-center gap-2">
            <span
              className={classNames(
                "text-sm font-semibold",
                prescription.discontinued ? "text-gray-700" : "text-gray-900"
              )}
            >
              {prescription.medicine_object?.name ?? prescription.medicine_old}
            </span>

            {prescription.discontinued && (
              <span className="hidden rounded-full border border-gray-500 bg-gray-200 px-1.5 text-xs font-medium text-gray-700 lg:block">
                {t("discontinued")}
              </span>
            )}

            {prescription.route && (
              <span className="hidden rounded-full border border-blue-500 bg-blue-100 px-1.5 text-xs font-medium text-blue-700 lg:block">
                {t(prescription.route)}
              </span>
            )}
          </div>

          <div className="flex gap-1 text-xs font-semibold text-gray-900 lg:flex-col lg:px-2 lg:text-center">
            {prescription.dosage_type !== "TITRATED" ? (
              <p>{prescription.base_dosage}</p>
            ) : (
              <p>
                {prescription.base_dosage} - {prescription.target_dosage}
              </p>
            )}

            <p>
              {prescription.dosage_type !== "PRN"
                ? t("PRESCRIPTION_FREQUENCY_" + prescription.frequency)
                : prescription.indicator}
            </p>
          </div>
        </div>
      </td>

      <td />

      {/* Administration Cells */}
      {props.intervals.map(({ start, end }, index) => (
        <>
          <td key={`event-seperator-${index}`}>
            <AdministrationEventSeperator date={start} />
          </td>

          <td key={`event-socket-${index}`} className="text-center">
            {!data?.results ? (
              <CareIcon
                icon="l-spinner"
                className="animate-spin text-lg text-gray-500"
              />
            ) : (
              <AdministrationEventCell
                administrations={data.results}
                interval={{ start, end }}
                prescription={prescription}
                refetch={refetch}
              />
            )}
          </td>
        </>
      ))}
      <td />

      {/* Action Buttons */}
      <td className="space-x-1 pr-2 text-right">
        <ButtonV2
          type="button"
          size="small"
          disabled={prescription.discontinued}
          ghost
          border
          onClick={() => setShowAdminister(true)}
        >
          {t("administer")}
        </ButtonV2>
      </td>
    </tr>
  );
}
