import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { AuthorizedForConsultationRelatedActions } from "@/CAREUI/misc/AuthorizedChild";

import ButtonV2, { Cancel, Submit } from "@/components/Common/ButtonV2";
import DialogModal from "@/components/Common/Dialog";
import AdministerMedicine from "@/components/Medicine/AdministerMedicine";
import DiscontinuePrescription from "@/components/Medicine/DiscontinuePrescription";
import EditPrescriptionForm from "@/components/Medicine/EditPrescriptionForm";
import AdministrationEventCell from "@/components/Medicine/MedicineAdministrationSheet/AdministrationEventCell";
import AdministrationEventSeperator from "@/components/Medicine/MedicineAdministrationSheet/AdministrationEventSeperator";
import PrescriptionDetailCard from "@/components/Medicine/PrescriptionDetailCard";
import { Prescription } from "@/components/Medicine/models";
import MedicineRoutes from "@/components/Medicine/routes";

import useSlug from "@/hooks/useSlug";

import useQuery from "@/Utils/request/useQuery";
import { classNames, formatDateTime } from "@/Utils/utils";

interface Props {
  prescription: Prescription;
  intervals: { start: Date; end: Date }[];
  refetch: () => void;
  readonly: boolean;
  id: string;
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
          "YYYY-MM-DD",
        ),
        administered_date_before: formatDateTime(
          props.intervals[props.intervals.length - 1].end,
          "YYYY-MM-DD",
        ),
        archived: false,
      },
      key: `${prescription.last_administration?.administered_date}`,
    },
  );

  return (
    <>
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
              <AuthorizedForConsultationRelatedActions>
                {!props.readonly && (
                  <>
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
                      <CareIcon icon="l-syringe" className="text-lg" />
                      {t("administer")}
                    </Submit>
                  </>
                )}
              </AuthorizedForConsultationRelatedActions>
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
              : "prescription_medication",
          )}: ${
            prescription.medicine_object?.name ?? prescription.medicine_old
          }`}
          description={
            <div className="mt-2 flex w-full justify-start gap-2 text-warning-500">
              <CareIcon icon="l-info-circle" className="text-base" />
              <span>{t("edit_caution_note")}</span>
            </div>
          }
          className="w-full max-w-4xl lg:min-w-[768px]"
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
      <tr
        className={classNames(
          "group transition-all duration-200 ease-in-out",
          loading ? "bg-secondary-300" : "bg-white hover:bg-primary-100",
        )}
        id={props.id}
      >
        <td
          className="bg-secondary-white sticky left-0 z-10 cursor-pointer bg-white py-3 pl-4 text-left transition-all duration-200 ease-in-out group-hover:bg-primary-100"
          onClick={() => setShowDetails(true)}
        >
          <div className="flex flex-col gap-1 lg:flex-row lg:justify-between lg:gap-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span
                  className={classNames(
                    "text-sm font-semibold uppercase",
                    prescription.discontinued
                      ? "text-secondary-700"
                      : "text-secondary-900",
                  )}
                >
                  {prescription.medicine_object?.name ??
                    prescription.medicine_old}
                </span>

                {prescription.discontinued && (
                  <span className="hidden rounded-full border border-secondary-500 bg-secondary-200 px-1.5 text-xs font-medium text-secondary-700 lg:block">
                    {t("discontinued")}
                  </span>
                )}

                {prescription.route && (
                  <span className="hidden rounded-full border border-blue-500 bg-blue-100 px-1.5 text-xs font-medium text-blue-700 lg:block">
                    {t(prescription.route)}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium capitalize text-secondary-700">
                {prescription.medicine_object?.generic}
              </span>
            </div>

            <div className="flex gap-1 text-xs font-semibold text-secondary-900 lg:flex-col lg:px-2 lg:text-center">
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
                  className="animate-spin text-lg text-secondary-500"
                />
              ) : (
                <AdministrationEventCell
                  administrations={data.results}
                  interval={{ start, end }}
                  prescription={prescription}
                  refetch={refetch}
                  readonly={props.readonly}
                />
              )}
            </td>
          </>
        ))}
        <td />

        {/* Action Buttons */}
        <td className="space-x-1 pr-2 text-right">
          <AuthorizedForConsultationRelatedActions>
            {!props.readonly && (
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
            )}
          </AuthorizedForConsultationRelatedActions>
        </td>
      </tr>
    </>
  );
}
