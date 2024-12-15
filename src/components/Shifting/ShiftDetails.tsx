import careConfig from "@careConfig";
import { t } from "i18next";
import { QRCodeSVG } from "qrcode.react";
import { Link, navigate } from "raviger";
import { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useTranslation } from "react-i18next";

import RecordMeta from "@/CAREUI/display/RecordMeta";
import CareIcon from "@/CAREUI/icons/CareIcon";
import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import { formatDateTime, formatName, formatPatientAge } from "@/Utils/utils";

export const printData = (data: any) => {
  const patientData = data.patient_object;
  const consultation = data.patient.last_consultation as ConsultationModel;
  const patientGender = GENDER_TYPES.find(
    (i) => i.id === patientData?.gender,
  )?.text;

  return (
    <PrintPreview title={t("Patient Referral Letter")}>
      <Card className="shadow-none border-none">
        <CardHeader className="flex flex-col items-center space-y-4 sm:flex-row sm:justify-between sm:space-y-0">
          <CardTitle className="mx-auto my-auto text-lg font-bold sm:text-2xl">
            {t("referral_letter")}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex flex-col-reverse items-start justify-end sm:flex-row sm:items-center">
            {data.is_kasp && (
              <img
                alt="logo"
                src={careConfig.headerLogo?.dark}
                className="max-h-12"
              />
            )}
            <QRCodeSVG
              value={`${window.location.origin}/shifting/${data.id}`}
              size={120}
              className="mt-4 sm:mt-0"
            />
          </div>

          <div className="mt-6 text-lg">
            <span className="font-semibold">{t("name_of_hospital")}: </span>
            {data.is_kasp
              ? t("district_program_management_supporting_unit")
              : data.origin_facility_object?.name || "--"}
          </div>

          <div className="my-6 border-b-2"></div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 text-lg">
            <div>
              <h3 className="mb-2 font-semibold">{t("Patient Information")}</h3>
              <p>
                <span className="font-semibold leading-relaxed">
                  {t("name")}:{" "}
                </span>
                {patientData?.name}
              </p>
              <p>
                <span className="font-semibold leading-relaxed">
                  {t("age")}:{" "}
                </span>
                {formatPatientAge(patientData, true)}
              </p>
              <p>
                <span className="font-semibold leading-relaxed">
                  {t("gender")}:{" "}
                </span>
                {patientGender || "-"}
              </p>
              <p>
                <span className="font-semibold leading-relaxed">
                  {t("phone")}:{" "}
                </span>{" "}
                {patientData?.phone_number || "-"}
              </p>
            </div>

            <div className="text-lg">
              <h3 className="mb-2  font-semibold">{t("address")}</h3>
              <p className=" whitespace-pre-line">
                {patientData?.address || "-"}
              </p>
              {patientData?.nationality === "India" && (
                <>
                  <p>
                    {patientData?.ward_object?.name},{" "}
                    {patientData?.local_body_object?.name}
                  </p>
                  <p>{patientData?.district_object?.name || "-"}</p>
                  <p>{patientData?.state_object?.name}</p>
                </>
              )}
            </div>
          </div>

          <div className="my-6 border-b-2"></div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 text-lg">
            <div>
              <p>
                <span className="font-semibold leading-relaxed">
                  {t("date_of_admission")}:{" "}
                </span>
                {formatDateTime(
                  consultation.encounter_date || consultation.created_date,
                ) || "-"}
              </p>
              <p>
                <span className="font-semibold leading-relaxed">
                  {t("unique_id")}:{" "}
                </span>{" "}
                {data.id}
              </p>
              <p>
                <span className="font-semibold leading-relaxed">
                  {t("patient_no")}:{" "}
                </span>{" "}
                {consultation.patient_no || "-"}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <p>
                <span className="font-semibold leading-relaxed">
                  {t("date_of_positive_covid_19_swab")}:{" "}
                </span>
                {(patientData?.date_of_test &&
                  formatDateTime(patientData.date_of_test)) ||
                  "-"}
              </p>
              <p>
                <span className="font-semibold leading-relaxed">
                  {t("covid_19_cat_gov")}:{" "}
                </span>{" "}
                {consultation.category || "-"}
              </p>
              <p>
                <span className="font-semibold leading-relaxed">
                  {t("referred_to")}:{" "}
                </span>
                {data.assigned_facility_external ||
                  data.assigned_facility_object?.name ||
                  "--"}
              </p>
              <p>
                <span className="font-semibold leading-relaxed">
                  {t("reason_for_referral")}:{" "}
                </span>{" "}
                {data.reason || "--"}
              </p>
              <p>
                <span className="font-semibold leading-relaxed">
                  {t("treatment_summary")}:{" "}
                </span>{" "}
                {consultation.treatment_plan || "-"}
              </p>
            </div>
          </div>

          <div className="my-6 border-b-2"></div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {t("approved_by_district_covid_control_room")}
            </p>
            <p className="text-sm">{t("auto_generated_for_care")}</p>
          </div>
        </CardContent>
      </Card>
    </PrintPreview>
  );
};

export default function ShiftDetails(props: { id: string }) {
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { t } = useTranslation();

  const shiftStatusOptions = careConfig.wartimeShifting
    ? SHIFTING_CHOICES_WARTIME
    : SHIFTING_CHOICES_PEACETIME;

  const { data, loading } = useTanStackQueryInstead(routes.getShiftDetails, {
    pathParams: { id: props.id },
  });
  const _showCopyToclipBoard = (data: any) => {
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

  const _showPatientCard = (patientData: PatientModel) => {
    const patientGender = GENDER_TYPES.find(
      (i) => i.id === patientData?.gender,
    )?.text;

    return (
      <div className="mr-3 mt-2 h-full rounded-lg  bg-white p-4 text-black shadow md:mr-8">
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
      <div className="mt-2 h-full rounded-lg shadow bg-white p-5 text-gray-800 ">
        <div className="my-2">
          <span className="mr-2 font-semibold leading-relaxed">
            {t("name")} :
          </span>
          <span className="ml-14">{facilityData?.name || "--"}</span>
        </div>
        <div className="my-2">
          <span className="mr-2 font-semibold leading-relaxed">
            {t("facility_type")} :
          </span>
          <span className="ml-1">
            {facilityData?.facility_type?.name || "--"}
          </span>
        </div>
        <div className="my-2">
          <span className="mr-2 font-semibold leading-relaxed">
            {t("district")} :
          </span>
          <span className="ml-11">
            {facilityData?.district_object?.name || "--"}
          </span>
        </div>
        <div className="my-2">
          <span className="mr-2 font-semibold leading-relaxed">
            {t("local_body")} :
          </span>
          <span className="ml-4">
            {facilityData?.local_body_object?.name || "--"}
          </span>
        </div>
        <div className="my-2">
          <span className="mr-2 font-semibold leading-relaxed">
            {t("state")} :
          </span>
          <span className="ml-14">
            {facilityData?.state_object?.name || "--"}
          </span>
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
        <div className="my-4">{printData(data)}</div>
      ) : (
        <Page
          title={t("shifting_details")}
          crumbsReplacements={{
            [props.id]: { name: data?.patient_object?.name },
          }}
          backUrl="/shifting/board"
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
          <div>
            <div className="flex flex-col lg:flex-row justify-between mt-2 rounded-lg border p-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-8 ">
                <div className="col-span-2 border-b-2 pb-2 lg:border-b-0 lg:border-r-2 lg:pb-0">
                  <div className="text-sm font-medium leading-5 text-secondary-700">
                    {t("created")} on
                  </div>
                  <div className="mt-1 whitespace-pre text-sm leading-5 text-gray-700 font-semibold">
                    <RecordMeta
                      time={data?.created_date}
                      user={data?.created_by_object}
                      inlineUser={true}
                      inlineClassName={"flex-wrap"}
                    />
                  </div>
                </div>
                <div className="col-span-2 mt-2 lg:mt-0">
                  <div className="text-sm font-medium leading-5 text-secondary-700">
                    {t("last_edited")}
                  </div>
                  <div className="mt-1 whitespace-pre text-sm leading-5 text-gray-700 font-semibold">
                    <RecordMeta
                      time={data?.modified_date}
                      user={data?.last_edited_by_object}
                      inlineUser={true}
                      inlineClassName={"flex-wrap"}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-4 lg:mt-0">
                <div className="relative group w-full sm:w-auto">
                  <button
                    className={`w-full px-4 py-2 rounded-lg sm:w-auto underline text-green-600 ${
                      ["COMPLETED", "CANCELLED"].includes(data?.status || "")
                        ? "cursor-not-allowed bg-secondary-100"
                        : "hover:text-green-700"
                    }`}
                    disabled={["COMPLETED", "CANCELLED"].includes(
                      data?.status || "",
                    )}
                    onClick={() =>
                      navigate(`/shifting/${data?.external_id}/update`)
                    }
                  >
                    {t("update_status_details")}
                  </button>
                  {["COMPLETED", "CANCELLED"].includes(data?.status || "") && (
                    <div className="absolute left-1/2 top-full mt-1 -translate-x-1/2 w-max text-xs bg-gray-700 text-white p-2 rounded-md shadow-lg hidden group-hover:block">
                      A shifting request, once {data?.status.toLowerCase()}{" "}
                      cannot be updated
                    </div>
                  )}
                </div>
                <button
                  className="w-full sm:w-auto underline text-green-600 "
                  onClick={() => setIsPrintMode(true)}
                >
                  <CareIcon icon="l-file-alt" className="mr-2 text-base" />
                  {t("referral_letter")}
                </button>
              </div>
            </div>

            <div className="mt-4 h-full rounded-lg bg-white p-4 text-sm text-gray-600 shadow px-4 sm:px-6 md:px-8 lg:px-10">
              <div className="flex flex-wrap justify-between mb-3">
                <div className="w-full md:w-auto">
                  <span className="font-semibold text-lg leading-relaxed mr-2">
                    {t("patient_name")} :
                  </span>
                  <span className="text-gray-900 text-lg font-semibold leading-5">
                    {data?.patient_object?.name}
                  </span>
                </div>
                <div className="w-full md:w-auto mt-2 md:mt-0">
                  <Link
                    className="underline text-blue-700 font-semibold leading-5"
                    href={`/patient/${data?.patient_object?.id}`}
                  >
                    {"View Patient details"}
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <span className="font-semibold leading-relaxed">
                    Status :{" "}
                  </span>
                  <span className="badge badge-pill badge-primary px-2 py-1">
                    {shiftStatusOptions.find(
                      (option) => data?.status === option.text,
                    )?.label || data?.status}
                  </span>
                </div>
                <div>
                  <span className="font-semibold leading-relaxed">
                    {t("is_up_shift")} :
                  </span>
                  <span className="badge badge-pill badge-warning px-2 py-1 ml-1">
                    {data?.is_up_shift ? t("yes") : t("no")}
                  </span>
                </div>
                <div>
                  <span className="font-semibold leading-relaxed">
                    {t("is_emergency")} :
                  </span>
                  <span className="badge badge-pill badge-danger px-2 py-1 ml-1">
                    {data?.emergency ? t("yes") : t("no")}
                  </span>
                </div>
                <div>
                  <span className="font-semibold leading-relaxed">
                    {t("patient_category")} :
                  </span>
                  <span className="badge badge-pill badge-warning px-2 py-1 ml-1">
                    {data?.patient_object.last_consultation?.last_daily_round
                      ?.patient_category ??
                      data?.patient_object.last_consultation?.category}
                  </span>
                </div>
                <div>
                  <span className="font-semibold leading-relaxed">
                    {t("contact_person_at_the_facility")} :
                  </span>
                  <span className="ml-1 text-gray-900 font-semibold leading-5">
                    {data?.refering_facility_contact_name || "--"}
                  </span>
                </div>
                <div>
                  <span className="font-semibold leading-relaxed">
                    {t("phone_number_at_current_facility")} :
                  </span>
                  <span className="ml-1 text-gray-900 font-semibold leading-5">
                    {data?.refering_facility_contact_number ? (
                      <a href={`tel:${data.refering_facility_contact_number}`}>
                        {data.refering_facility_contact_number}
                      </a>
                    ) : (
                      "--"
                    )}
                  </span>
                </div>
                {careConfig.kasp.enabled && (
                  <div>
                    <span className="font-semibold leading-relaxed">
                      {careConfig.kasp.fullString} :
                    </span>
                    <span className="badge badge-pill badge-warning px-2 py-1 ml-1">
                      {data?.is_kasp ? t("yes") : t("no")}
                    </span>
                  </div>
                )}
                {careConfig.wartimeShifting && (
                  <>
                    <div>
                      <span className="font-semibold leading-relaxed">
                        {t("vehicle_preference")} :
                      </span>
                      <span className="ml-1 text-gray-900 font-semibold leading-5">
                        {data?.vehicle_preference ||
                          data?.preferred_vehicle_choice}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold leading-relaxed">
                        {t("facility_preference")} :
                      </span>
                      <span className="ml-1 text-gray-900 font-semibold leading-5">
                        {data?.assigned_facility_type || "--"}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold leading-relaxed">
                        {t("severity_of_breathlessness")} :
                      </span>
                      <span className="ml-1 text-gray-900 font-semibold leading-5">
                        {data?.breathlessness_level || "--"}
                      </span>
                    </div>
                  </>
                )}
                <div>
                  <span className="font-semibold leading-relaxed">
                    {t("origin_facility")} :
                  </span>
                  <span className="ml-1 text-gray-900 font-semibold leading-5">
                    {data?.origin_facility_object?.name || "--"}
                  </span>
                </div>
                {careConfig.wartimeShifting && (
                  <div>
                    <span className="font-semibold leading-relaxed">
                      {t("shifting_approving_facility")}:
                    </span>
                    <span className="ml-1 text-gray-900 font-semibold leading-5">
                      {data?.shifting_approving_facility_object?.name || "--"}
                    </span>
                  </div>
                )}
                <div>
                  <span className="font-semibold leading-relaxed">
                    {t("assigned_facility")} :
                  </span>
                  <span className="ml-1 text-gray-900 font-semibold leading-5">
                    {data?.assigned_facility_external ||
                      data?.assigned_facility_object?.name ||
                      "--"}
                  </span>
                </div>
                <div className="col-span-1 sm:col-span-2 md:col-span-4">
                  <span className="font-semibold leading-relaxed">
                    {t("reason")} :
                  </span>
                  <span className="ml-1 text-gray-900 font-semibold leading-5">
                    {data?.reason || "--"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid-cols-4 gap-4 md:grid text-secondary-900">
            <div className="col-span-2">
              {/* <div>
                <h4 className="mt-8">
                  {t("details_of_patient")} {showCopyToclipBoard(data)}
                </h4>
                {data?.patient_object && showPatientCard(data?.patient_object)}
              </div> */}
              <div
                className="pb-16 block relative cursor-pointer border-l-2 px-4 border-l-secondary-300 
               mt-2 hover:border-primary-500 transition-all before:absolute before:-left-[7px] before:top-0 before:w-3 before:aspect-square before:bg-secondary-400 before:rounded-full hover:before:bg-primary-500 before:transition-all"
              >
                <h4 className="mt-8 text-lg">
                  {t("details_of_origin_facility")}
                </h4>

                {showFacilityCard(data?.origin_facility_object)}
              </div>
              <div className="pb-16 block relative cursor-pointer border-l-2 px-4 border-l-secondary-300 hover:border-primary-500 transition-all before:absolute before:-left-[7px] before:top-0 before:w-3 before:aspect-square before:bg-secondary-400 before:rounded-full hover:before:bg-primary-500 before:transition-all">
                <h4 className="text-lg">{t("Ambulance Details")}</h4>

                <div className="mt-2 h-full rounded-lg  bg-white p-4  text-gray-800 shadow">
                  <div className="my-2">
                    <span className="font-semibold leading-relaxed ">
                      {t("ambulance_driver_name")} :
                    </span>
                    <span className="ml-7">
                      {data?.ambulance_driver_name || "--"}
                    </span>
                  </div>
                  <div className="my-2">
                    <span className="font-semibold leading-relaxed">
                      {t("ambulance_phone_number")}:
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
                  <div className="my-2">
                    <span className="font-semibold leading-relaxed">
                      {t("ambulance_number")} :
                    </span>
                    <span className="ml-28">
                      {data?.ambulance_number || "--"}
                    </span>
                  </div>
                </div>
              </div>
              {!data?.assigned_facility_external && (
                <div className="pb-16 block relative cursor-pointer border-l-2 px-4 border-l-secondary-300 hover:border-primary-500 transition-all before:absolute before:-left-[7px] before:top-0 before:w-3 before:aspect-square before:bg-secondary-400 before:rounded-full hover:before:bg-primary-500 before:transition-all">
                  <h4 className="text-lg">
                    {t("details_of_assigned_facility")}
                  </h4>
                  {showFacilityCard(data?.assigned_facility_object)}
                </div>
              )}
              {careConfig.wartimeShifting && (
                <div className="pb-16 block relative cursor-pointer border-l-2 px-4 border-l-secondary-300 hover:border-primary-500 transition-all before:absolute before:-left-[7px] before:top-0 before:w-3 before:aspect-square before:bg-secondary-400 before:rounded-full hover:before:bg-primary-500 before:transition-all">
                  <h4 className="mt-8">
                    {t("details_of_shifting_approving_facility")}
                  </h4>
                  {showFacilityCard(data?.shifting_approving_facility_object)}
                </div>
              )}
            </div>
            <div className="col-span-2">
              <div className="mb-10 ">
                <h4 className="mt-8">{t("comments")}</h4>
                <CommentSection id={props.id} />
              </div>
            </div>
          </div>
        </Page>
      )}
    </div>
  );
}
