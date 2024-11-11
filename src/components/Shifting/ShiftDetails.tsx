import careConfig from "@careConfig";
import QRCode from "qrcode.react";
import { Link, navigate } from "raviger";
import { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useTranslation } from "react-i18next";

import RecordMeta from "@/CAREUI/display/RecordMeta";
import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { ConsultationModel } from "@/components/Facility/models";
import { PatientModel } from "@/components/Patient/models";
import CommentSection from "@/components/Shifting/ShiftingCommentsSection";

import {
  GENDER_TYPES,
  SHIFTING_CHOICES_PEACETIME,
  SHIFTING_CHOICES_WARTIME,
} from "@/common/constants";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import { formatDateTime, formatName, formatPatientAge } from "@/Utils/utils";

export default function ShiftDetails(props: { id: string }) {
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { t } = useTranslation();

  const shiftStatusOptions = careConfig.wartimeShifting
    ? SHIFTING_CHOICES_WARTIME
    : SHIFTING_CHOICES_PEACETIME;

  const { data, loading } = useQuery(routes.getShiftDetails, {
    pathParams: { id: props.id },
  });
  const showCopyToclipBoard = (data: any) => {
    return (
      <a href="#">
        <CopyToClipboard
          text={copyContent(data)}
          onCopy={() => setIsCopied(true)}
        >
          {isCopied ? (
            <span className="copied-to-cb">{t("copied_to_clipboard")}</span>
          ) : (
            <span className="copy-to-cb">
              <CareIcon icon="l-clipboard" className="text-2xl" />
            </span>
          )}
        </CopyToClipboard>
      </a>
    );
  };

  const copyContent = (data: any) => {
    let formattedText =
      t("name") +
      ":" +
      data?.patient_object?.name +
      "\n" +
      t("age") +
      ":" +
      (data?.patient_object
        ? formatPatientAge(data.patient_object, true)
        : "") +
      "\n" +
      t("origin_facility") +
      ":" +
      data?.origin_facility_object?.name +
      "\n" +
      t("contact_number") +
      ":" +
      data?.patient_object?.phone_number +
      "\n" +
      t("address") +
      ":" +
      data?.patient_object?.address +
      "\n" +
      t("reason") +
      ":" +
      data?.reason;
    if (careConfig.wartimeShifting) {
      formattedText +=
        t("facility_preference") + ": " + data?.assigned_facility_type + "\n";
    }
    return formattedText;
  };

  setTimeout(() => {
    setIsCopied(false);
  }, 5000);

  const showPatientCard = (patientData: PatientModel) => {
    const patientGender = GENDER_TYPES.find(
      (i) => i.id === patientData?.gender,
    )?.text;

    return (
      <div className="mr-3 mt-2 h-full rounded-lg border bg-white p-4 text-black shadow md:mr-8">
        <div className="mt-2 grid grid-cols-1 justify-between gap-4 md:grid-cols-2">
          <div>
            <span className="font-semibold leading-relaxed">{t("name")}: </span>
            <Link href={`/patient/${patientData?.id}`}>
              {patientData?.name}
            </Link>
          </div>
          {patientData?.is_medical_worker && (
            <div>
              <span className="font-semibold leading-relaxed">
                {t("medical_worker")}{" "}
              </span>
              <span className="badge badge-pill badge-primary">{t("yes")}</span>
            </div>
          )}
          <div>
            <span className="font-semibold leading-relaxed">
              {t("facility")}:{" "}
            </span>
            {patientData?.facility_object?.name || "-"}
          </div>
          {patientData?.date_of_birth ? (
            <div>
              <span className="font-semibold leading-relaxed">
                {t("date_of_birth")}:{" "}
              </span>
              {patientData?.date_of_birth}
            </div>
          ) : (
            <div>
              <span className="font-semibold leading-relaxed">
                {t("age")}:{" "}
              </span>
              {patientData ? formatPatientAge(patientData, true) : ""}
            </div>
          )}
          {patientData?.gender === 2 && patientData?.is_antenatal && (
            <div>
              <span className="font-semibold leading-relaxed">
                {t("is_antenatal")}:{" "}
              </span>
              <span className="badge badge-pill badge-warning">{t("yes")}</span>
            </div>
          )}
          <div>
            <span className="font-semibold leading-relaxed">
              {t("gender")}:{" "}
            </span>
            {patientGender}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">
              {t("phone")}:{" "}
            </span>
            <a href={`tel:${patientData?.phone_number}`}>
              {patientData?.phone_number || "-"}
            </a>
          </div>
          <div>
            <span className="font-semibold leading-relaxed">
              {t("nationality")}:{" "}
            </span>
            {patientData?.nationality || "-"}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">
              {t("blood_group")}:{" "}
            </span>
            {patientData?.blood_group || "-"}
          </div>
          {patientData?.nationality !== "India" && (
            <div>
              <span className="font-semibold leading-relaxed">
                {t("passport_number")}:{" "}
              </span>
              {patientData?.passport_no || "-"}
            </div>
          )}
          {patientData?.nationality === "India" && (
            <>
              <div>
                <span className="font-semibold leading-relaxed">
                  {t("state")}:{" "}
                </span>
                {patientData?.state_object?.name}
              </div>
              <div>
                <span className="font-semibold leading-relaxed">
                  {t("district")}:{" "}
                </span>
                {patientData?.district_object?.name || "-"}
              </div>
              <div>
                <span className="font-semibold leading-relaxed">
                  {t("local_body")}:{" "}
                </span>
                {patientData?.local_body_object?.name || "-"}
              </div>
            </>
          )}
          <div>
            <span className="font-semibold leading-relaxed">
              {t("address")}:{" "}
            </span>
            {patientData?.address || "-"}
          </div>
          {patientData?.ongoing_medication && (
            <div className="md:col-span-2">
              <span className="font-semibold leading-relaxed">
                {t("ongoing_medications")}:{" "}
              </span>
              {patientData?.ongoing_medication}
            </div>
          )}
          {patientData?.allergies && (
            <div className="md:col-span-2">
              <span className="font-semibold leading-relaxed">
                {t("allergies")}:{" "}
              </span>
              {patientData?.allergies}
            </div>
          )}
        </div>
      </div>
    );
  };

  const showFacilityCard = (facilityData: any) => {
    return (
      <div className="mt-2 h-full rounded-lg border bg-white p-4 text-black shadow">
        <div>
          <span className="mr-1 font-semibold leading-relaxed">
            {t("name")}:{" "}
          </span>
          {facilityData?.name || "--"}
        </div>
        <div>
          <span className="mr-1 font-semibold leading-relaxed">
            {t("facility_type")}:{" "}
          </span>
          {facilityData?.facility_type?.name || "--"}
        </div>
        <div>
          <span className="mr-1 font-semibold leading-relaxed">
            {t("district")}:{" "}
          </span>
          {facilityData?.district_object?.name || "--"}
        </div>
        <div>
          <span className="mr-1 font-semibold leading-relaxed">
            {t("local_body")}:{" "}
          </span>
          {facilityData?.local_body_object?.name || "--"}
        </div>
        <div>
          <span className="mr-1 font-semibold leading-relaxed">
            {t("state")}:{" "}
          </span>
          {facilityData?.state_object?.name || "--"}
        </div>
      </div>
    );
  };

  const printData = (data: any) => {
    const patientData = data.patient_object;
    const consultation = data.patient.last_consultation as ConsultationModel;
    const patientGender = GENDER_TYPES.find(
      (i) => i.id === patientData?.gender,
    )?.text;

    return (
      <div id="section-to-print" className="print bg-white">
        <div>
          {data.is_kasp && <img alt="logo" src={careConfig.headerLogo?.dark} />}
        </div>
        <div className="mx-2">
          <div className="mt-6">
            <span className="mt-4 font-semibold leading-relaxed">
              {t("name_of_hospital")}:{" "}
            </span>
            {data.is_kasp
              ? t("district_program_management_supporting_unit")
              : data.origin_facility_object?.name || "--"}
            {/*  Made static based on #757 */}
          </div>
          <div className="mt-6 text-center text-xl font-bold">
            {t("referral_letter")}
          </div>
          <div className="mt-4 text-left">
            <span className="font-semibold leading-relaxed">
              {" "}
              {t("date_and_time")}{" "}
            </span>
            {formatDateTime(data.created_date) || "--"}
          </div>
          <div className="mt-2 text-left">
            <span className="font-semibold leading-relaxed">
              {" "}
              {t("unique_id")} :
            </span>
            {data.id}
          </div>

          <div className="mt-4">
            <div>
              <span className="font-semibold leading-relaxed">
                {t("name")}:{" "}
              </span>
              {patientData?.name}
            </div>
          </div>
          <div className="mt-2 flex justify-between">
            <div>
              <span className="font-semibold leading-relaxed">
                {t("age")}:{" "}
              </span>
              {patientData ? formatPatientAge(patientData, true) : ""}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                {t("gender")}:{" "}
              </span>
              {patientGender}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                {t("phone")}:{" "}
              </span>
              <span>{patientData?.phone_number || ""}</span>
            </div>
          </div>
          <div className="mt-2 flex text-left">
            <span className="font-semibold leading-relaxed">
              {t("address")}:{" "}
            </span>
            <div className="ml-2">
              <div className="whitespace-pre-wrap">
                {patientData?.address || "-"}
              </div>
              {patientData?.nationality === "India" && (
                <>
                  <div>
                    {patientData?.ward_object?.name},
                    {patientData?.local_body_object?.name}
                  </div>
                  <div>{patientData?.district_object?.name || "-"}</div>
                  <div>{patientData?.state_object?.name}</div>
                </>
              )}
            </div>
          </div>
          <div className="mt-2 flex justify-between">
            <div>
              <span className="font-semibold leading-relaxed">
                {t("date_of_admission")}:{" "}
              </span>
              {formatDateTime(
                consultation.encounter_date || consultation.created_date,
              ) || "-"}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                {t("patient_no")}:{" "}
              </span>
              {consultation.patient_no || "-"}
            </div>
          </div>
          <div className="mt-2 flex justify-between">
            <div>
              <span className="font-semibold leading-relaxed">
                {t("date_of_positive_covid_19_swab")}:{" "}
              </span>
              {(patientData?.date_of_test &&
                formatDateTime(patientData?.date_of_test)) ||
                "-"}
            </div>
          </div>

          {/* <div className="mt-2 flex justify-between">
            <div>
              <span className="font-semibold leading-relaxed">
                {t("diagnosis")}:{" "}
              </span>
              {consultation.diagnosis || "-"}
            </div>
          </div> */}

          <div className="mt-6 flex justify-between">
            <div>
              <span className="font-semibold leading-relaxed">
                {t("covid_19_cat_gov")}{" "}
              </span>
              {consultation.category || "-"}
            </div>
          </div>

          <div className="mt-2 flex justify-between">
            <div>
              <span className="font-semibold leading-relaxed">
                {t("referred_to")}:{" "}
              </span>
              {data.assigned_facility_external ||
                data.assigned_facility_object?.name ||
                "--"}
            </div>
          </div>

          <div className="mt-2 flex justify-between">
            <div>
              <span className="font-semibold leading-relaxed">
                {t("reason_for_referral")}:{" "}
              </span>
              {data.reason || "--"}
            </div>
          </div>
          <div className="mt-2 flex justify-between">
            <div>
              <span className="font-semibold leading-relaxed">
                {t("treatment_summary")}:{" "}
              </span>
              {consultation.treatment_plan || "-"}
            </div>
          </div>
          <div className="mt-6 flex justify-between">
            <div className="flex">
              <div>
                <div className="">
                  <QRCode
                    value={`${window.location.origin}/shifting/ data.id`}
                  />
                </div>
              </div>
            </div>
            <div className="mt-10">
              <span className="font-semibold leading-relaxed">
                {t("approved_by_district_covid_control_room")}
              </span>
            </div>
          </div>
          <div className="mt-20 flex justify-center text-center">
            {t("auto_generated_for_care")}
          </div>
          <div className="font-xs font-secondary-600 text-center font-mono">
            {window.location.origin}/shifting/{data.id}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      {isPrintMode ? (
        <div className="my-4">
          <div className="my-4 flex justify-end gap-3">
            <ButtonV2 onClick={(_) => window.print()}>
              <CareIcon icon="l-print" className="mr-2 text-base" />{" "}
              {t("print_referral_letter")}
            </ButtonV2>
            <ButtonV2
              onClick={(_) => setIsPrintMode(false)}
              variant="secondary"
            >
              <CareIcon icon="l-times" className="mr-2 text-base" />{" "}
              {t("close")}
            </ButtonV2>
          </div>
          {printData(data)}
        </div>
      ) : (
        <Page
          title={t("shifting_details")}
          backUrl="/shifting/board"
          options={
            <div className="flex gap-2">
              <ButtonV2
                tooltip={
                  ["COMPLETED", "CANCELLED"].includes(data?.status || "")
                    ? `A shifting request, once ${data?.status.toLowerCase()} cannot be updated`
                    : ""
                }
                tooltipClassName="tooltip-top -translate-x-28 -translate-y-1 text-xs"
                disabled={
                  data?.status === "COMPLETED" || data?.status === "CANCELLED"
                }
                onClick={() =>
                  navigate(`/shifting/${data?.external_id}/update`)
                }
              >
                {t("update_status_details")}
              </ButtonV2>

              <ButtonV2 onClick={() => setIsPrintMode(true)}>
                <CareIcon icon="l-file-alt" className="mr-2 text-base" />{" "}
                {t("referral_letter")}
              </ButtonV2>
            </div>
          }
        >
          {data?.assigned_to_object && (
            <div className="relative rounded-lg bg-primary-200 shadow">
              <div className="mx-auto max-w-screen-xl p-3 sm:px-6 lg:px-8">
                <div className="pr-16 sm:px-16 sm:text-center">
                  <p className="font-bold text-primary-800">
                    <span className="inline">
                      {t("assigned_to")}: {formatName(data.assigned_to_object)}{" "}
                      - {data.assigned_to_object.user_type}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="mt-4 h-full rounded-lg border bg-white p-4 text-black shadow">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div>
                <span className="font-semibold leading-relaxed">
                  {t("patient_name")}:{" "}
                </span>
                <Link href={`/patient/${data?.patient_object?.id}`}>
                  {data?.patient_object?.name}
                </Link>
              </div>
              <div>
                <span className="font-semibold leading-relaxed">Status: </span>
                <span className="badge badge-pill badge-primary px-2 py-1">
                  {shiftStatusOptions.find(
                    (option) => data?.status === option.text,
                  )?.label || data?.status}
                </span>
              </div>
              <div>
                <span className="font-semibold leading-relaxed">
                  {t("origin_facility")}:{" "}
                </span>
                {data?.origin_facility_object?.name || "--"}
              </div>
              {careConfig.wartimeShifting && (
                <div>
                  <span className="font-semibold leading-relaxed">
                    {t("shifting_approving_facility")}:{" "}
                  </span>
                  {data?.shifting_approving_facility_object?.name || "--"}
                </div>
              )}
              <div>
                <span className="font-semibold leading-relaxed">
                  {t("assigned_facility")}:{" "}
                </span>
                {data?.assigned_facility_external ||
                  data?.assigned_facility_object?.name ||
                  "--"}
              </div>
              <div>
                <span className="font-semibold leading-relaxed">
                  {t("contact_person_at_the_facility")}:{" "}
                </span>
                {data?.refering_facility_contact_name || "--"}
              </div>
              <div>
                <span className="font-semibold leading-relaxed">
                  {t("phone_number_at_current_facility")}:{" "}
                </span>
                {data?.refering_facility_contact_number ? (
                  <a href={`tel:${data.refering_facility_contact_number}`}>
                    {data.refering_facility_contact_number}
                  </a>
                ) : (
                  "--"
                )}
              </div>
              <div>
                <span className="font-semibold leading-relaxed">
                  {" "}
                  {t("is_emergency")}:{" "}
                </span>
                <span className="badge badge-pill badge-danger px-2 py-1">
                  {" "}
                  {data?.emergency ? t("yes") : t("no")}
                </span>
              </div>
              <div>
                <span className="font-semibold leading-relaxed">
                  {t("is_up_shift")}:{" "}
                </span>
                <span className="badge badge-pill badge-warning px-2 py-1">
                  {" "}
                  {data?.is_up_shift ? t("yes") : t("no")}
                </span>
              </div>
              <div>
                <span className="font-semibold leading-relaxed">
                  {t("patient_category")}:{" "}
                </span>
                <span className="badge badge-pill badge-warning px-2 py-1">
                  {" "}
                  {data?.patient_object.last_consultation?.last_daily_round
                    ?.patient_category ??
                    data?.patient_object.last_consultation?.category}
                </span>
              </div>
              {careConfig.kasp.enabled && (
                <div>
                  <span className="font-semibold leading-relaxed">
                    {careConfig.kasp.fullString}:{" "}
                  </span>
                  <span className="badge badge-pill badge-warning px-2 py-1">
                    {" "}
                    {data?.is_kasp ? t("yes") : t("no")}
                  </span>
                </div>
              )}
              {careConfig.wartimeShifting && (
                <>
                  <div>
                    <span className="font-semibold leading-relaxed">
                      {careConfig.kasp.fullString}:{" "}
                    </span>
                    <span className="badge badge-pill badge-warning px-2 py-1">
                      {" "}
                      {data?.is_kasp ? t("yes") : t("no")}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold leading-relaxed">
                      {t("vehicle_preference")}:{" "}
                    </span>
                    {data?.vehicle_preference || data?.preferred_vehicle_choice}
                  </div>
                  <div>
                    <span className="font-semibold leading-relaxed">
                      {t("facility_preference")}:{" "}
                    </span>
                    {data?.assigned_facility_type || "--"}
                  </div>
                  <div>
                    <span className="font-semibold leading-relaxed">
                      {t("severity_of_breathlessness")}:{" "}
                    </span>
                    {data?.breathlessness_level || "--"}
                  </div>{" "}
                </>
              )}

              <div className="md:col-span-2 md:row-span-2">
                <span className="font-semibold leading-relaxed">
                  {t("reason")}:{" "}
                </span>
                <span className="ml-2">{data?.reason || "--"}</span>
              </div>
              <div className="md:col-span-2 md:row-span-2">
                <span className="font-semibold leading-relaxed">
                  {t("ambulance_driver_name")}:{" "}
                </span>
                <span className="ml-2">
                  {data?.ambulance_driver_name || "--"}
                </span>
              </div>
              <div className="md:col-span-2 md:row-span-2">
                <span className="font-semibold leading-relaxed">
                  {t("ambulance_phone_number")}:{" "}
                </span>
                <span className="ml-2">
                  {data?.ambulance_phone_number ? (
                    <a href={`tel:${data?.ambulance_phone_number}`}>
                      {data?.ambulance_phone_number}
                    </a>
                  ) : (
                    "--"
                  )}
                </span>
              </div>
              <div className="md:col-span-2 md:row-span-2">
                <span className="font-semibold leading-relaxed">
                  {t("ambulance_number")}:{" "}
                </span>
                <span className="ml-2">{data?.ambulance_number || "--"}</span>
              </div>
              <div className="md:col-span-2 md:row-span-2">
                <span className="font-semibold leading-relaxed">
                  {t("comments")}:{" "}
                </span>
                <span className="ml-2">{data?.comments || "--"}</span>
              </div>

              <RecordMeta
                prefix={
                  <span className="font-semibold leading-relaxed">
                    {t("created")}:
                  </span>
                }
                time={data?.created_date}
              />
              <RecordMeta
                prefix={
                  <span className="font-semibold leading-relaxed">
                    {t("updated")}:
                  </span>
                }
                time={data?.modified_date}
              />
            </div>
          </div>

          <div className="grid-cols-5 gap-2 md:grid">
            <div className="col-span-3">
              <div>
                <h4 className="mt-8">
                  {t("details_of_patient")} {showCopyToclipBoard(data)}
                </h4>
                {data?.patient_object && showPatientCard(data?.patient_object)}
              </div>
              <div className="mb-10 mr-3 md:mr-8">
                <h4 className="mt-8">{t("comments")}</h4>
                <CommentSection id={props.id} />
              </div>
            </div>

            <div className="col-span-2">
              <h4 className="mt-8">{t("audit_log")}</h4>

              <div className="mt-2 grid rounded-lg bg-white p-2 px-4 text-center shadow lg:grid-cols-2">
                <div className="border-b-2 pb-2 lg:border-b-0 lg:border-r-2 lg:pb-0">
                  <div className="text-sm font-medium leading-5 text-secondary-500">
                    {t("created")}
                  </div>
                  <div className="mt-1 whitespace-pre text-sm leading-5 text-secondary-900">
                    <RecordMeta
                      time={data?.created_date}
                      user={data?.created_by_object}
                      inlineUser={true}
                      inlineClassName={"flex-wrap justify-center"}
                    />
                  </div>
                </div>
                <div className="mt-2 lg:mt-0">
                  <div className="text-sm font-medium leading-5 text-secondary-500">
                    {t("last_edited")}
                  </div>
                  <div className="mt-1 whitespace-pre text-sm leading-5 text-secondary-900">
                    <RecordMeta
                      time={data?.modified_date}
                      user={data?.last_edited_by_object}
                      inlineUser={true}
                      inlineClassName={"flex-wrap justify-center"}
                    />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="mt-8">{t("details_of_origin_facility")}</h4>

                {showFacilityCard(data?.origin_facility_object)}
              </div>
              {!data?.assigned_facility_external && (
                <div>
                  <h4 className="mt-8">{t("details_of_assigned_facility")}</h4>
                  {showFacilityCard(data?.assigned_facility_object)}
                </div>
              )}
              {careConfig.wartimeShifting && (
                <div>
                  <h4 className="mt-8">
                    {t("details_of_shifting_approving_facility")}
                  </h4>
                  {showFacilityCard(data?.shifting_approving_facility_object)}
                </div>
              )}
            </div>
          </div>
        </Page>
      )}
    </div>
  );
}
