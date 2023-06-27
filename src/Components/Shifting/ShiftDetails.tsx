import * as Notification from "../../Utils/Notifications.js";

import {
  GENDER_TYPES,
  SHIFTING_CHOICES_PEACETIME,
  SHIFTING_CHOICES_WARTIME,
  TEST_TYPE_CHOICES,
} from "../../Common/constants";
import { Link, navigate } from "raviger";
import React, { useCallback, useState } from "react";
import { deleteShiftRecord, getShiftDetails } from "../../Redux/actions";
import { statusType, useAbortableEffect } from "../../Common/utils";

import ButtonV2 from "../Common/components/ButtonV2";
import CommentSection from "./CommentsSection";
import ConfirmDialogV2 from "../Common/ConfirmDialogV2";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Page from "../Common/components/Page";
import QRCode from "qrcode.react";
import RecordMeta from "../../CAREUI/display/RecordMeta";
import { formatDate } from "../../Utils/utils";
import loadable from "@loadable/component";
import useConfig from "../../Common/hooks/useConfig";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";

const Loading = loadable(() => import("../Common/Loading"));

export default function ShiftDetails(props: { id: string }) {
  const {
    static_header_logo,
    kasp_full_string,
    wartime_shifting,
    kasp_enabled,
  } = useConfig();
  const dispatch: any = useDispatch();
  const initialData: any = {};
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [openDeleteShiftDialog, setOpenDeleteShiftDialog] =
    React.useState(false);
  const { t } = useTranslation();

  const shiftStatusOptions = wartime_shifting
    ? SHIFTING_CHOICES_WARTIME
    : SHIFTING_CHOICES_PEACETIME;

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(getShiftDetails({ id: props.id }));
      if (!status.aborted) {
        if (res && res.data) {
          setData(res.data);
        }
        setIsLoading(false);
      }
    },
    [props.id, dispatch]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  const handleShiftDelete = async () => {
    setOpenDeleteShiftDialog(true);

    const res = await dispatch(deleteShiftRecord(props.id));
    if (res?.status == 204) {
      Notification.Success({
        msg: t("shifting_deleted"),
      });
    } else {
      Notification.Error({
        msg: t("error_deleting_shifting") + (res?.data?.detail || ""),
      });
    }

    navigate("/shifting");
  };

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
              <i className="fas fa-clipboard"></i>
            </span>
          )}
        </CopyToClipboard>
      </a>
    );
  };

  const copyContent = (data: any) => {
    let formattedText =
      t("disease_status") +
      ": *" +
      data?.patient_object?.disease_status +
      "* \n" +
      t("name") +
      ":" +
      data?.patient_object?.name +
      "\n" +
      t("age") +
      ":" +
      data?.patient_object?.age +
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
    if (wartime_shifting) {
      formattedText +=
        t("facility_preference") + ": " + data?.assigned_facility_type + "\n";
    }
    return formattedText;
  };

  setTimeout(() => {
    setIsCopied(false);
  }, 5000);

  const showPatientCard = (patientData: any) => {
    const patientGender = GENDER_TYPES.find(
      (i) => i.id === patientData?.gender
    )?.text;
    const testType = TEST_TYPE_CHOICES.find(
      (i) => i.id === patientData?.test_type
    )?.text;

    return (
      <div className="border rounded-lg bg-white shadow h-full text-black mt-2 mr-3 md:mr-8 p-4">
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 justify-between gap-4">
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
              {t("disease_status")}{" "}
            </span>
            <span className="badge badge-pill badge-warning">
              {patientData?.disease_status}
            </span>
          </div>
          <div>
            <span className="font-semibold leading-relaxed">
              {t("test_type")}:{" "}
            </span>
            {(patientData?.test_type && testType) || "-"}
          </div>
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
              {patientData?.age}
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
      <div className="border rounded-lg bg-white shadow h-full text-black mt-2 p-4">
        <div>
          <span className="font-semibold leading-relaxed mr-1">
            {t("name")}:{" "}
          </span>
          {facilityData?.name || "--"}
        </div>
        <div>
          <span className="font-semibold leading-relaxed mr-1">
            {t("facility_type")}:{" "}
          </span>
          {facilityData?.facility_type?.name || "--"}
        </div>
        <div>
          <span className="font-semibold leading-relaxed mr-1">
            {t("district")}:{" "}
          </span>
          {facilityData?.district_object?.name || "--"}
        </div>
        <div>
          <span className="font-semibold leading-relaxed mr-1">
            {t("local_body")}:{" "}
          </span>
          {facilityData?.local_body_object?.name || "--"}
        </div>
        <div>
          <span className="font-semibold leading-relaxed mr-1">
            {t("state")}:{" "}
          </span>
          {facilityData?.state_object?.name || "--"}
        </div>
      </div>
    );
  };

  const printData = (data: any) => {
    const patientData = data.patient_object;
    const consultation = data.patient.last_consultation;
    const patientGender = GENDER_TYPES.find(
      (i) => i.id === patientData?.gender
    )?.text;
    const testType = TEST_TYPE_CHOICES.find(
      (i) => i.id === patientData?.test_type
    )?.text;

    return (
      <div id="section-to-print" className="print bg-white ">
        <div>{data.is_kasp && <img alt="logo" src={static_header_logo} />}</div>
        <div className="mx-2">
          <div className="mt-6">
            <span className="font-semibold leading-relaxed mt-4">
              {t("name_of_hospital")}:{" "}
            </span>
            {data.is_kasp
              ? t("district_program_management_supporting_unit")
              : data.origin_facility_object?.name || "--"}
            {/*  Made static based on #757 */}
          </div>
          <div className="font-bold text-xl text-center mt-6">
            {t("referral_letter")}
          </div>
          <div className="text-left mt-4">
            <span className="font-semibold leading-relaxed">
              {" "}
              {t("date_and_time")}{" "}
            </span>
            {formatDate(data.created_date) || "--"}
          </div>
          <div className="text-left mt-2">
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
              {patientData?.age}
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
          <div className="text-left mt-2 flex">
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
              {formatDate(
                consultation.admission_date || consultation.created_date
              ) || "-"}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                {t("op_ip_no")}:{" "}
              </span>
              {consultation.ip_no || "-"}
            </div>
          </div>
          <div className="mt-2 flex justify-between">
            <div>
              <span className="font-semibold leading-relaxed">
                {t("date_of_positive_covid_19_swab")}:{" "}
              </span>
              {(patientData?.date_of_test &&
                formatDate(patientData?.date_of_test)) ||
                "-"}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                {t("test_type")}:{" "}
              </span>
              {(patientData?.test_type && testType) || "-"}
            </div>
          </div>

          <div className="mt-2 flex justify-between">
            <div>
              <span className="font-semibold leading-relaxed">
                {t("diagnosis")}:{" "}
              </span>
              {consultation.diagnosis || "-"}
            </div>
          </div>

          {/* <div className="mt-2 flex justify-between">
            <div>
              <span className="font-semibold leading-relaxed">Comorbidities (if any): </span>
              {consultation.diagnosis || '-'}
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
              {consultation.prescribed_medication || "-"}
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
          <div className="flex justify-center text-center mt-20">
            {t("auto_generated_for_care")}
          </div>
          <div className="font-xs font-gray-600 text-center font-mono">
            {window.location.origin}/shifting/{data.id}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div>
      {isPrintMode ? (
        <div className="my-4">
          <div className="my-4 flex justify-end gap-3">
            <ButtonV2 onClick={(_) => window.print()}>
              <i className="fas fa-print mr-2"></i> {t("print_referral_letter")}
            </ButtonV2>
            <ButtonV2
              onClick={(_) => setIsPrintMode(false)}
              variant="secondary"
            >
              <i className="fas fa-times mr-2"></i> {t("close")}
            </ButtonV2>
          </div>
          {printData(data)}
        </div>
      ) : (
        <Page
          title={t("shifting_details")}
          backUrl="/shifting/board-view"
          options={
            <div className="flex gap-2">
              <ButtonV2
                tooltip={
                  ["COMPLETED", "CANCELLED"].includes(data.status)
                    ? `A shifting request, once ${data.status.toLowerCase()} cannot be updated`
                    : ""
                }
                tooltipClassName="tooltip-top -translate-x-28 -translate-y-1 text-xs"
                disabled={
                  data.status === "COMPLETED" || data.status === "CANCELLED"
                }
                onClick={() => navigate(`/shifting/${data.external_id}/update`)}
              >
                {t("update_status_details")}
              </ButtonV2>

              <ButtonV2 onClick={() => setIsPrintMode(true)}>
                <i className="fas fa-file-alt mr-2"></i> {t("referral_letter")}
              </ButtonV2>
            </div>
          }
        >
          {data.assigned_to_object && (
            <div className="relative rounded-lg shadow bg-primary-200">
              <div className="max-w-screen-xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
                <div className="pr-16 sm:text-center sm:px-16">
                  <p className="font-bold text-primary-800">
                    <span className="inline">
                      {t("assigned_to")}: {data.assigned_to_object.first_name}{" "}
                      {data.assigned_to_object.last_name} -{" "}
                      {data.assigned_to_object.user_type}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="border rounded-lg bg-white shadow h-full text-black mt-4 p-4">
            <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
              <div>
                <span className="font-semibold leading-relaxed">
                  {t("patient_name")}:{" "}
                </span>
                <Link href={`/patient/${data.patient_object?.id}`}>
                  {data.patient_object?.name}
                </Link>
              </div>
              <div>
                <span className="font-semibold leading-relaxed">Status: </span>
                <span className="badge badge-pill badge-primary py-1 px-2">
                  {shiftStatusOptions.find(
                    (option) => data.status === option.text
                  )?.label || data.status}
                </span>
              </div>
              <div>
                <span className="font-semibold leading-relaxed">
                  {t("origin_facility")}:{" "}
                </span>
                {data.origin_facility_object?.name || "--"}
              </div>
              {wartime_shifting && (
                <div>
                  <span className="font-semibold leading-relaxed">
                    {t("shifting_approving_facility")}:{" "}
                  </span>
                  {data.shifting_approving_facility_object?.name || "--"}
                </div>
              )}
              <div>
                <span className="font-semibold leading-relaxed">
                  {t("assigned_facility")}:{" "}
                </span>
                {data.assigned_facility_external ||
                  data.assigned_facility_object?.name ||
                  "--"}
              </div>
              <div>
                <span className="font-semibold leading-relaxed">
                  {t("contact_person_at_the_facility")}:{" "}
                </span>
                {data.refering_facility_contact_name || "--"}
              </div>
              <div>
                <span className="font-semibold leading-relaxed">
                  {t("phone_number_at_current_facility")}:{" "}
                </span>
                {data.refering_facility_contact_number ? (
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
                <span className="badge badge-pill badge-danger py-1 px-2">
                  {" "}
                  {data.emergency ? t("yes") : t("no")}
                </span>
              </div>
              <div>
                <span className="font-semibold leading-relaxed">
                  {t("is_up_shift")}:{" "}
                </span>
                <span className="badge badge-pill badge-warning py-1 px-2">
                  {" "}
                  {data.is_up_shift ? t("yes") : t("no")}
                </span>
              </div>
              <div>
                <span className="font-semibold leading-relaxed">
                  {t("patient_category")}:{" "}
                </span>
                <span className="badge badge-pill badge-warning py-1 px-2">
                  {" "}
                  {data.patient_object.last_consultation?.last_daily_round
                    ?.patient_category ??
                    data.patient_object.last_consultation?.category}
                </span>
              </div>
              {kasp_enabled && (
                <div>
                  <span className="font-semibold leading-relaxed">
                    {kasp_full_string}:{" "}
                  </span>
                  <span className="badge badge-pill badge-warning py-1 px-2">
                    {" "}
                    {data.is_kasp ? t("yes") : t("no")}
                  </span>
                </div>
              )}
              {wartime_shifting && (
                <>
                  <div>
                    <span className="font-semibold leading-relaxed">
                      {kasp_full_string}:{" "}
                    </span>
                    <span className="badge badge-pill badge-warning py-1 px-2">
                      {" "}
                      {data.is_kasp ? t("yes") : t("no")}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold leading-relaxed">
                      {t("vehicle_preference")}:{" "}
                    </span>
                    {data.vehicle_preference || data.preferred_vehicle_choice}
                  </div>
                  <div>
                    <span className="font-semibold leading-relaxed">
                      {t("facility_preference")}:{" "}
                    </span>
                    {data.assigned_facility_type || "--"}
                  </div>
                  <div>
                    <span className="font-semibold leading-relaxed">
                      {t("severity_of_breathlessness")}:{" "}
                    </span>
                    {data.breathlessness_level || "--"}
                  </div>{" "}
                </>
              )}

              <div className="md:row-span-2 md:col-span-2">
                <span className="font-semibold leading-relaxed">
                  {t("reason")}:{" "}
                </span>
                <span className="ml-2">{data.reason || "--"}</span>
              </div>
              <div className="md:row-span-2 md:col-span-2">
                <span className="font-semibold leading-relaxed">
                  {t("ambulance_driver_name")}:{" "}
                </span>
                <span className="ml-2">
                  {data.ambulance_driver_name || "--"}
                </span>
              </div>
              <div className="md:row-span-2 md:col-span-2">
                <span className="font-semibold leading-relaxed">
                  {t("ambulance_phone_number")}:{" "}
                </span>
                <span className="ml-2">
                  {data.ambulance_phone_number ? (
                    <a href={`tel:${data.ambulance_phone_number}`}>
                      {data.ambulance_phone_number}
                    </a>
                  ) : (
                    "--"
                  )}
                </span>
              </div>
              <div className="md:row-span-2 md:col-span-2">
                <span className="font-semibold leading-relaxed">
                  {t("ambulance_number")}:{" "}
                </span>
                <span className="ml-2">{data.ambulance_number || "--"}</span>
              </div>
              <div className="md:row-span-2 md:col-span-2">
                <span className="font-semibold leading-relaxed">
                  {t("comments")}:{" "}
                </span>
                <span className="ml-2">{data.comments || "--"}</span>
              </div>

              <RecordMeta
                prefix={
                  <span className="font-semibold leading-relaxed">
                    {t("created")}:
                  </span>
                }
                time={data.created_date}
              />
              <RecordMeta
                prefix={
                  <span className="font-semibold leading-relaxed">
                    {t("updated")}:
                  </span>
                }
                time={data.modified_date}
              />
            </div>

            <div className="flex justify-end mt-4">
              <div>
                <ButtonV2
                  variant="danger"
                  onClick={() => setOpenDeleteShiftDialog(true)}
                >
                  {t("delete_record")}
                </ButtonV2>
                <ConfirmDialogV2
                  title={t("authorize_shift_delete")}
                  description={t("record_delete_confirm")}
                  action="Confirm"
                  show={openDeleteShiftDialog}
                  onClose={() => setOpenDeleteShiftDialog(false)}
                  onConfirm={handleShiftDelete}
                />
              </div>
            </div>
          </div>

          <div className="md:grid grid-cols-5 gap-2">
            <div className="col-span-3">
              <div>
                <h4 className="mt-8">
                  {t("details_of_patient")} {showCopyToclipBoard(data)}
                </h4>
                {showPatientCard(data.patient_object)}
              </div>
              <div className="mr-3 md:mr-8 mb-10">
                <h4 className="mt-8">{t("comments")}</h4>
                <CommentSection id={props.id} />
              </div>
            </div>

            <div className="col-span-2">
              <h4 className="mt-8">{t("audit_log")}</h4>

              <div className="p-2 bg-white rounded-lg shadow text-center px-4 mt-2 grid lg:grid-cols-2">
                <div className="lg:border-r-2 border-b-2 lg:border-b-0 pb-2 lg:pb-0">
                  <div className="text-sm leading-5 font-medium text-gray-500">
                    {t("created")}
                  </div>
                  <div className="mt-1 text-sm leading-5 text-gray-900 whitespace-pre">
                    <div className="text-sm">
                      {data?.created_by_object?.first_name}
                      {data?.created_by_object?.last_name}
                    </div>
                    <div className="text-xs">
                      {data.created_date && formatDate(data.created_date)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 lg:mt-0">
                  <div className="text-sm leading-5 font-medium text-gray-500">
                    {t("last_edited")}
                  </div>
                  <div className="mt-1 text-sm leading-5 text-gray-900 whitespace-pre">
                    <div className="text-sm">
                      {data?.last_edited_by_object?.first_name}{" "}
                      {data?.last_edited_by_object?.last_name}
                    </div>
                    <div className="text-xs">
                      {data.modified_date && formatDate(data.modified_date)}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="mt-8">{t("details_of_origin_facility")}</h4>

                {showFacilityCard(data.origin_facility_object)}
              </div>
              {!data.assigned_facility_external && (
                <div>
                  <h4 className="mt-8">{t("details_of_assigned_facility")}</h4>
                  {showFacilityCard(data.assigned_facility_object)}
                </div>
              )}
              {wartime_shifting && (
                <div>
                  <h4 className="mt-8">
                    {t("details_of_shifting_approving_facility")}
                  </h4>
                  {showFacilityCard(data.shifting_approving_facility_object)}
                </div>
              )}
            </div>
          </div>
        </Page>
      )}
    </div>
  );
}
