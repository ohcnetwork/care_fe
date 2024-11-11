import careConfig from "@careConfig";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import PageHeadTitle from "@/components/Common/PageHeadTitle";
import {
  ActiveConditionVerificationStatuses,
  ConsultationDiagnosis,
} from "@/components/Diagnosis/types";
import { ConsultationModel } from "@/components/Facility/models";
import MedicineRoutes from "@/components/Medicine/routes";
import { PatientModel } from "@/components/Patient/models";

import { GENDER_TYPES } from "@/common/constants";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import { formatDate, formatDateTime, formatPatientAge } from "@/Utils/utils";

export interface ITreatmentSummaryProps {
  consultationId: string;
  patientId: string;
  facilityId: string;
}

export default function TreatmentSummary({
  consultationId,
  patientId,
}: ITreatmentSummaryProps) {
  const { t } = useTranslation();
  const date = new Date();

  const { data: patientData } = useQuery(routes.getPatient, {
    pathParams: { id: patientId },
    prefetch: patientId !== undefined,
  });

  const { data: consultationData } = useQuery(routes.getConsultation, {
    pathParams: { id: consultationId },
    prefetch: consultationId !== undefined,
  });

  return (
    <div>
      <PageHeadTitle title={t("treatment_summary__head_title")} />
      <div className="my-4">
        <PrintPreview title={t("treatment_summary__head_title")}>
          <div id="section-to-print" className="mx-5">
            <div className="mb-3 flex items-center justify-between p-4">
              <h3>{consultationData?.facility_name}</h3>
              <img
                className="h-10 w-auto"
                src={careConfig.mainLogo?.dark}
                alt="care logo"
              />
            </div>
            <h2 className="text-center text-lg">
              {t("treatment_summary__heading")}
            </h2>

            <div className="text-right font-bold">{formatDate(date)}</div>

            <div className="mb-5 mt-2 border border-gray-800">
              <BasicDetailsSection
                patientData={patientData}
                consultationData={consultationData}
              />

              <ComorbiditiesSection patientData={patientData} />

              <DiagnosisSection consultationData={consultationData} />

              <InvestigationsSection consultationId={consultationId} />

              <TreatmentSection consultationData={consultationData} />

              <PrescriptionsSection consultationId={consultationId} />

              <InstructionsSection consultationData={consultationData} />
            </div>
          </div>
        </PrintPreview>
      </div>
    </div>
  );
}

interface IBasicDetailsSection {
  patientData?: PatientModel;
  consultationData?: ConsultationModel;
}

function BasicDetailsSection({
  patientData,
  consultationData,
}: IBasicDetailsSection) {
  const { t } = useTranslation();

  return (
    <>
      <div className="grid border-b-2 border-gray-800 sm:grid-cols-2 print:grid-cols-3 print:md:grid-cols-3">
        <div className="col-span-1 border-b-2 border-gray-800 px-3 py-2 sm:border-b-0 sm:border-r-2 print:border-b-0 print:border-r-2">
          <b>{t("patient_registration__name")} :</b> {patientData?.name ?? ""}
        </div>
        <div className="col-span-1 px-3 py-2">
          <b>{t("patient_registration__address")} :</b>{" "}
          {patientData?.address ?? ""}
        </div>
      </div>

      <div className="grid border-b-2 border-gray-800 sm:grid-cols-2 print:grid-cols-3 print:md:grid-cols-3">
        <div className="col-span-1 grid sm:grid-cols-2 print:grid-cols-2">
          <div className="col-span-1 border-b-2 border-gray-800 px-3 py-2 sm:border-b-0 sm:border-r-2 print:border-b-0 print:border-r-2">
            <b>{t("patient_registration__age")} :</b>{" "}
            {patientData ? formatPatientAge(patientData, true) : ""}
          </div>
          <div className="col-span-1 border-b-2 border-gray-800 px-3 py-2 sm:border-b-0 sm:border-r-2 print:border-b-0 print:border-r-2">
            <b>
              {consultationData?.suggestion === "A"
                ? t("patient_consultation__ip")
                : t("patient_consultation__op")}{" "}
              :
            </b>{" "}
            {consultationData?.patient_no ?? ""}
          </div>
        </div>

        <div className="col-span-1 px-3 py-2">
          {consultationData?.suggestion === "DC" ? (
            <b>{t("patient_consultation__dc_admission")} :</b>
          ) : (
            <b>{t("patient_consultation__admission")} :</b>
          )}{" "}
          <span>
            {consultationData?.encounter_date
              ? formatDateTime(consultationData.encounter_date)
              : t("empty_date_time")}
          </span>
        </div>
      </div>

      <div className="grid border-b-2 border-gray-800 sm:grid-cols-2 print:grid-cols-3 print:md:grid-cols-3">
        <div className="col-span-1 border-b-2 border-gray-800 px-3 py-2 sm:border-b-0 sm:border-r-2 print:border-b-0 print:border-r-2">
          <b>{t("patient_registration__gender")} :</b>{" "}
          {GENDER_TYPES.find((i) => i.id === patientData?.gender)?.text}
        </div>

        <div className="col-span-1 px-3 py-2">
          <b>{t("patient_registration__contact")} :</b>{" "}
          <span>{patientData?.emergency_phone_number ?? ""}</span>
        </div>
      </div>
    </>
  );
}

interface IComorbiditiesSection {
  patientData?: PatientModel;
}

function ComorbiditiesSection({ patientData }: IComorbiditiesSection) {
  const { t } = useTranslation();

  return patientData?.medical_history?.filter(
    (comorbidities) => comorbidities.disease !== "NO",
  ).length ? (
    <div className="border-b-2 border-gray-800 px-5 py-2">
      <b>{t("patient_registration__comorbidities")}</b>
      <div className="mx-0 sm:mx-5 print:mx-5">
        <table className="w-full border-collapse border border-gray-800">
          <thead>
            <tr>
              <th className="border border-gray-800">
                {t("patient_registration__comorbidities__disease")}
              </th>
              <th className="border border-gray-800">
                {t("patient_registration__comorbidities__details")}
              </th>
            </tr>
          </thead>
          <tbody>
            {patientData.medical_history.map((obj, index) => {
              return (
                <tr key={index}>
                  <td className="border border-gray-800 text-center">
                    {obj["disease"]}
                  </td>
                  <td className="border border-gray-800 text-center">
                    {obj["details"] || "---"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  ) : null;
}

interface IDiagnosisSection {
  consultationData?: ConsultationModel;
}

type DiagnosisType =
  | (typeof ActiveConditionVerificationStatuses)[number]
  | "principal";

function DiagnosisSection({ consultationData }: IDiagnosisSection) {
  const { t } = useTranslation();

  const diagnoses = useMemo(() => {
    return consultationData?.diagnoses?.reduce(
      (acc, curr) => {
        if (curr.is_principal) {
          acc.principal.push(curr);
        } else if (
          ActiveConditionVerificationStatuses.includes(
            curr.verification_status as (typeof ActiveConditionVerificationStatuses)[number],
          )
        ) {
          acc[curr.verification_status as keyof typeof acc].push(curr);
        }

        return acc;
      },
      {
        principal: [],
        confirmed: [],
        provisional: [],
        unconfirmed: [],
        differential: [],
      } as Record<DiagnosisType, ConsultationDiagnosis[]>,
    );
  }, [consultationData?.diagnoses]);

  if (!diagnoses) {
    return null;
  }

  return (
    <div className="border-b-2 border-gray-800 px-5 py-2">
      <b>{t("diagnosis")}</b>
      <div className="mx-5">
        {(
          [
            "principal",
            "confirmed",
            "provisional",
            "unconfirmed",
            "differential",
          ] as DiagnosisType[]
        ).map(
          (type) =>
            !!diagnoses[type].length && (
              <div>
                <b>
                  {t(`diagnosis__${type}`)} {t("diagnosis")}
                </b>
                <ol className="mx-6 list-decimal">
                  {diagnoses[type].map((d) => (
                    <li key={d.id}>
                      {d.diagnosis_object.label}
                      {d.is_principal && (
                        <span className="ml-2 rounded-sm bg-secondary-800 px-2 py-1 text-xs font-normal text-white">
                          {t(`diagnosis__${d.verification_status}`)}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ),
        )}
      </div>
    </div>
  );
}

interface IInvestigationsSection {
  consultationId: string;
}

function InvestigationsSection({ consultationId }: IInvestigationsSection) {
  const { t } = useTranslation();

  const { data: investigations } = useQuery(routes.getInvestigation, {
    pathParams: { consultation_external_id: consultationId },
    prefetch: consultationId !== undefined,
  });

  return investigations?.results.length ? (
    <div className="border-b-2 border-gray-800 px-5 py-2">
      <b>{t("suggested_investigations")}</b>

      <div className="mx-0 mt-2 overflow-x-auto sm:mx-5 print:mx-5">
        <table className="w-full border-collapse border border-gray-800">
          <thead>
            <tr>
              <th className="border border-gray-800 text-center">
                {t("investigations__date")}
              </th>
              <th className="border border-gray-800 text-center">
                {t("investigations__name")}
              </th>
              <th className="border border-gray-800 text-center">
                {t("investigations__result")}
              </th>
              <th className="border border-gray-800 text-center">
                {t("investigations__ideal_value")}
              </th>
              <th className="border border-gray-800 text-center">
                {t("investigations__range")}
              </th>
              <th className="border border-gray-800 text-center">
                {t("investigations__unit")}
              </th>
            </tr>
          </thead>

          <tbody>
            {investigations?.results.map((value, index) => (
              <tr key={index}>
                <td className="border border-gray-800 text-center">
                  {formatDate(value["session_object"]["session_created_date"])}
                </td>
                <td className="border border-gray-800 text-center">
                  {value["investigation_object"]["name"]}
                </td>
                <td className="border border-gray-800 text-center">
                  {value["notes"] || value["value"]}
                </td>
                <td className="border border-gray-800 text-center">
                  {value["investigation_object"]["ideal_value"] || "-"}
                </td>
                <td className="border border-gray-800 text-center">
                  {value["investigation_object"]["min_value"]} -{" "}
                  {value["investigation_object"]["max_value"]}
                </td>
                <td className="border border-gray-800 text-center">
                  {value["investigation_object"]["unit"] || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ) : null;
}

interface ITreatmentSection {
  consultationData?: ConsultationModel;
}

function TreatmentSection({ consultationData }: ITreatmentSection) {
  const { t } = useTranslation();

  const isTreatmentSummaryAvailable = useMemo(() => {
    return (
      consultationData?.last_daily_round &&
      (consultationData.last_daily_round.ventilator_spo2 ||
        consultationData.last_daily_round.temperature)
    );
  }, [consultationData]);

  return consultationData?.treatment_plan || isTreatmentSummaryAvailable ? (
    <div className="border-b-2 border-gray-800 px-5 py-2">
      {consultationData?.treatment_plan && (
        <>
          <b>{t("patient_consultation__treatment__plan")}</b>
          <p className="ml-4">{consultationData.treatment_plan}</p>
        </>
      )}

      {isTreatmentSummaryAvailable && (
        <>
          <b className="mb-2">
            {t("patient_consultation__treatment__summary")}
          </b>
          <div className="mx-0 overflow-x-auto sm:mx-5 print:mx-5">
            <table className="w-full border-collapse border border-gray-800">
              <thead>
                <tr>
                  <th className="border border-gray-800">
                    {t("patient_consultation__treatment__summary__date")}
                  </th>
                  <th className="border border-gray-800">
                    {t("patient_consultation__treatment__summary__spo2")}
                  </th>
                  <th className="border border-gray-800">
                    {t("patient_consultation__treatment__summary__temperature")}
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td className="border border-gray-800 text-center">
                    {formatDateTime(
                      consultationData?.last_daily_round?.modified_date,
                    )}
                  </td>
                  <td className="border border-gray-800 text-center">
                    {consultationData?.last_daily_round?.ventilator_spo2 || "-"}
                  </td>
                  <td className="border border-gray-800 text-center">
                    {consultationData?.last_daily_round?.temperature || "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  ) : null;
}

interface IPrescriptionsSection {
  consultationId: string;
}

function PrescriptionsSection({ consultationId }: IPrescriptionsSection) {
  const { t } = useTranslation();

  const { data: prescriptions } = useQuery(MedicineRoutes.listPrescriptions, {
    pathParams: { consultation: consultationId },
    query: { discontinued: false },
  });

  return prescriptions?.results.length ? (
    <div className="border-b-2 border-gray-800 px-5 py-2">
      <b>{t("active_prescriptions")}</b>

      <div className="mx-0 mt-2 overflow-x-auto sm:mx-5 print:mx-5">
        <table className="w-full border-collapse border border-gray-800">
          <thead>
            <tr>
              <th className="border border-gray-800 text-center">
                {t("prescriptions__medicine")}
              </th>
              <th className="border border-gray-800 text-center">
                {t("prescriptions__route")}
              </th>
              <th className="border border-gray-800 text-center">
                {t("prescriptions__dosage_frequency")}
              </th>
              <th className="border border-gray-800 text-center">
                {t("prescriptions__start_date")}
              </th>
            </tr>
          </thead>

          <tbody>
            {prescriptions?.results.map((prescription, index) => (
              <tr key={index}>
                <td className="border border-gray-800 text-center">
                  {prescription.medicine_object?.name ?? "-"}
                </td>
                <td className="border border-gray-800 text-center">
                  {prescription.route ?? "-"}
                </td>
                <td className="border border-gray-800 text-center">
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
                </td>
                <td className="border border-gray-800 text-center">
                  {formatDate(prescription.created_date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ) : null;
}

interface IInstructionsSection {
  consultationData?: ConsultationModel;
}

function InstructionsSection({ consultationData }: IInstructionsSection) {
  const { t } = useTranslation();

  return (
    <>
      {consultationData?.consultation_notes && (
        <div className="border-b-2 border-gray-800 px-5 py-2">
          <b>{t("patient_consultation__consultation_notes")}</b>

          <div className="mx-5">{consultationData.consultation_notes}</div>
        </div>
      )}

      {consultationData?.special_instruction && (
        <div className="border-b-2 border-gray-800 px-5 py-2">
          <b>{t("patient_consultation__special_instruction")}</b>

          <div className="mx-5">{consultationData.special_instruction}</div>
        </div>
      )}
    </>
  );
}
