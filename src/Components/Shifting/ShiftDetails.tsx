import React, { useState, useCallback } from "react";
import loadable from "@loadable/component";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getShiftDetails, deleteShiftRecord } from "../../Redux/actions";
import { navigate, Link } from "raviger";
import Button from "@material-ui/core/Button";
import QRCode from "qrcode.react";
import {
  GENDER_TYPES,
  KASP_FULL_STRING,
  TEST_TYPE_CHOICES,
} from "../../Common/constants";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import * as Notification from "../../Utils/Notifications.js";
import { CopyToClipboard } from "react-copy-to-clipboard";
import CommentSection from "./CommentsSection";
import { formatDate } from "../../Utils/utils";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

export default function ShiftDetails(props: { id: string }) {
  const dispatch: any = useDispatch();
  const initialData: any = {};
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [openDeleteShiftDialog, setOpenDeleteShiftDialog] =
    React.useState(false);

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
        msg: "Shifting record has been deleted successfully.",
      });
    } else {
      Notification.Error({
        msg:
          "Error while deleting Shifting record: " + (res?.data?.detail || ""),
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
            <span className="copied-to-cb">Copied to clipboard</span>
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
    const formattedText =
      "Disease Status: *" +
      data?.patient_object?.disease_status +
      "* \n" +
      "Name: " +
      data?.patient_object?.name +
      "\n" +
      "Age: " +
      data?.patient_object?.age +
      "\n" +
      "Origin facility: " +
      data?.orgin_facility_object?.name +
      "\n" +
      "Contact Number: " +
      data?.patient_object?.phone_number +
      "\n" +
      "Address: " +
      data?.patient_object?.address +
      "\n" +
      "Facility preference: " +
      data?.assigned_facility_type +
      "\n" +
      "Reason: " +
      data?.reason;
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
            <span className="font-semibold leading-relaxed">Name: </span>
            <Link href={`/patient/${patientData?.id}`}>
              {patientData?.name}
            </Link>
          </div>
          {patientData?.is_medical_worker && (
            <div>
              <span className="font-semibold leading-relaxed">
                Medical Worker:{" "}
              </span>
              <span className="badge badge-pill badge-primary">Yes</span>
            </div>
          )}
          <div>
            <span className="font-semibold leading-relaxed">
              Disease Status:{" "}
            </span>
            <span className="badge badge-pill badge-warning">
              {patientData?.disease_status}
            </span>
          </div>

          <div>
            <span className="font-semibold leading-relaxed">SRF ID: </span>
            {(patientData?.srf_id && patientData?.srf_id) || "-"}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Test Type: </span>
            {(patientData?.test_type && testType) || "-"}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">
              Date of Test:{" "}
            </span>
            {(patientData?.date_of_test &&
              formatDate(patientData?.date_of_test)) ||
              "-"}
          </div>

          <div>
            <span className="font-semibold leading-relaxed">Facility: </span>
            {patientData?.facility_object?.name || "-"}
          </div>
          {patientData?.date_of_birth ? (
            <div>
              <span className="font-semibold leading-relaxed">
                Date of birth:{" "}
              </span>
              {patientData?.date_of_birth}
            </div>
          ) : (
            <div>
              <span className="font-semibold leading-relaxed">Age: </span>
              {patientData?.age}
            </div>
          )}
          {patientData?.gender === 2 && patientData?.is_antenatal && (
            <div>
              <span className="font-semibold leading-relaxed">
                Is antenatal:{" "}
              </span>
              <span className="badge badge-pill badge-warning">Yes</span>
            </div>
          )}
          <div>
            <span className="font-semibold leading-relaxed">Gender: </span>
            {patientGender}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Phone: </span>
            <a href={`tel:${patientData?.phone_number}`}>
              {patientData?.phone_number || "-"}
            </a>
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Nationality: </span>
            {patientData?.nationality || "-"}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Blood Group: </span>
            {patientData?.blood_group || "-"}
          </div>
          {patientData?.nationality !== "India" && (
            <div>
              <span className="font-semibold leading-relaxed">
                Passport Number:{" "}
              </span>
              {patientData?.passport_no || "-"}
            </div>
          )}
          {patientData?.nationality === "India" && (
            <>
              <div>
                <span className="font-semibold leading-relaxed">State: </span>
                {patientData?.state_object?.name}
              </div>
              <div>
                <span className="font-semibold leading-relaxed">
                  District:{" "}
                </span>
                {patientData?.district_object?.name || "-"}
              </div>
              <div>
                <span className="font-semibold leading-relaxed">
                  Local Body:{" "}
                </span>
                {patientData?.local_body_object?.name || "-"}
              </div>
            </>
          )}
          <div>
            <span className="font-semibold leading-relaxed">Address: </span>
            {patientData?.address || "-"}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">
              Contact with confirmed carrier:{" "}
            </span>
            {patientData?.contact_with_confirmed_carrier ? (
              <span className="badge badge-pill badge-warning">Yes</span>
            ) : (
              <span className="badge badge-pill badge-secondary">No</span>
            )}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">
              Contact with suspected carrier:{" "}
            </span>
            {patientData?.contact_with_suspected_carrier ? (
              <span className="badge badge-pill badge-warning">Yes</span>
            ) : (
              <span className="badge badge-pill badge-secondary">No</span>
            )}
          </div>
          {patientData?.estimated_contact_date && (
            <div>
              <span className="font-semibold leading-relaxed">
                Estimated contact date:{" "}
              </span>
              {formatDate(patientData?.estimated_contact_date)}
            </div>
          )}
          <div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">
              Has SARI (Severe Acute Respiratory illness)?:{" "}
            </span>
            {patientData?.has_SARI ? (
              <span className="badge badge-pill badge-warning">Yes</span>
            ) : (
              <span className="badge badge-pill badge-secondary">No</span>
            )}
          </div>
          <div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">
              Domestic/international Travel (within last 28 days):{" "}
            </span>
            {patientData?.past_travel ? (
              <span className="badge badge-pill badge-warning">Yes</span>
            ) : (
              <span className="badge badge-pill badge-secondary">No</span>
            )}
          </div>
          {patientData?.countries_travelled &&
            !!patientData?.countries_travelled.length && (
              <div className="md:col-span-2">
                <span className="font-semibold leading-relaxed">
                  Countries travelled:{" "}
                </span>
                {Array.isArray(patientData?.countries_travelled)
                  ? patientData?.countries_travelled.join(", ")
                  : patientData?.countries_travelled.split(",").join(", ")}
              </div>
            )}
          {patientData?.ongoing_medication && (
            <div className="md:col-span-2">
              <span className="font-semibold leading-relaxed">
                Ongoing Medications{" "}
              </span>
              {patientData?.ongoing_medication}
            </div>
          )}
          {patientData?.allergies && (
            <div className="md:col-span-2">
              <span className="font-semibold leading-relaxed">Allergies: </span>
              {patientData?.allergies}
            </div>
          )}
          {!!patientData?.number_of_aged_dependents && (
            <div>
              <span className="font-semibold leading-relaxed">
                Number Of Aged Dependents (Above 60):{" "}
              </span>
              {patientData?.number_of_aged_dependents}
            </div>
          )}
          {!!patientData?.number_of_chronic_diseased_dependents && (
            <div>
              <span className="font-semibold leading-relaxed">
                Number Of Chronic Diseased Dependents:{" "}
              </span>
              {patientData?.number_of_chronic_diseased_dependents}
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
          <span className="font-semibold leading-relaxed mr-1">Name: </span>
          {facilityData?.name || "--"}
        </div>
        <div>
          <span className="font-semibold leading-relaxed mr-1">
            Facility type:{" "}
          </span>
          {facilityData?.facility_type?.name || "--"}
        </div>
        <div>
          <span className="font-semibold leading-relaxed mr-1">District: </span>
          {facilityData?.district_object?.name || "--"}
        </div>
        <div>
          <span className="font-semibold leading-relaxed mr-1">
            Local body:{" "}
          </span>
          {facilityData?.local_body_object?.name || "--"}
        </div>
        <div>
          <span className="font-semibold leading-relaxed mr-1">State: </span>
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
        <div>
          {data.is_kasp && (
            <img alt="logo" src={process.env.REACT_APP_HEADER_LOGO} />
          )}
        </div>
        <div className="mx-2">
          <div className="mt-6">
            <span className="font-semibold leading-relaxed mt-4">
              Name of Hospital:{" "}
            </span>
            {data.is_kasp
              ? "District Program Management Supporting Unit"
              : data.orgin_facility_object?.name || "--"}
            {/*  Made static based on #757 */}
          </div>
          <div className="font-bold text-xl text-center mt-6">
            REFERRAL LETTER
          </div>
          <div className="text-left mt-4">
            <span className="font-semibold leading-relaxed">
              {" "}
              Date and Time:{" "}
            </span>
            {formatDate(data.created_date) || "--"}
          </div>
          <div className="text-left mt-2">
            <span className="font-semibold leading-relaxed"> Unique Id: </span>
            {data.id}
          </div>

          <div className="mt-4">
            <div>
              <span className="font-semibold leading-relaxed">Name: </span>
              {patientData?.name}
            </div>
          </div>
          <div className="mt-2 flex justify-between">
            <div>
              <span className="font-semibold leading-relaxed">Age: </span>
              {patientData?.age}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">Gender: </span>
              {patientGender}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">Phone: </span>
              <span>{patientData?.phone_number || ""}</span>
            </div>
          </div>
          <div className="text-left mt-2 flex">
            <span className="font-semibold leading-relaxed"> Address: </span>
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
                Date of Admission:{" "}
              </span>
              {formatDate(
                consultation.admission_date || consultation.created_date
              ) || "-"}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">OP/IP No: </span>
              {consultation.ip_no || "-"}
            </div>
          </div>
          <div className="mt-2 flex justify-between">
            <div>
              <span className="font-semibold leading-relaxed">
                Date of Positive Covid 19 Swab:{" "}
              </span>
              {(patientData?.date_of_test &&
                formatDate(patientData?.date_of_test)) ||
                "-"}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">Test Type: </span>
              {(patientData?.test_type && testType) || "-"}
            </div>
          </div>

          <div className="mt-2 flex justify-between">
            <div>
              <span className="font-semibold leading-relaxed">Diagnosis: </span>
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
                Covid-19 Clinical Category as per Govt. of Kerala guideline
                (A/B/C):{" "}
              </span>
              {consultation.category || "-"}
            </div>
          </div>

          <div className="mt-2 flex justify-between">
            <div>
              <span className="font-semibold leading-relaxed">
                Referred to:{" "}
              </span>
              {data.assigned_facility_object?.name || "--"}
            </div>
          </div>

          <div className="mt-2 flex justify-between">
            <div>
              <span className="font-semibold leading-relaxed">
                Reason for referral:{" "}
              </span>
              {data.reason || "--"}
            </div>
          </div>
          <div className="mt-2 flex justify-between">
            <div>
              <span className="font-semibold leading-relaxed">
                Treatment Summary:{" "}
              </span>
              {consultation.prescribed_medication || "-"}
            </div>
          </div>
          <div className="mt-6 flex justify-between">
            <div className="flex">
              <div>
                <div className="">
                  <QRCode
                    value={`https://${process.env.REACT_APP_DEPLOYED_URL}/shifting/ data.id`}
                  />
                </div>
              </div>
            </div>
            <div className="mt-10">
              <span className="font-semibold leading-relaxed">
                Approved by District COVID Control Room
              </span>
            </div>
          </div>
          <div className="flex justify-center text-center mt-20">
            Auto Generated for Care
          </div>
          <div className="font-xs font-gray-600 text-center font-mono">
            {process.env.REACT_APP_DEPLOYED_URL}/shifting/{data.id}
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
          <div className="my-4 flex justify-end ">
            <button
              onClick={(_) => window.print()}
              className="btn btn-primary mr-2"
            >
              <i className="fas fa-print mr-2"></i> Print Referral Letter
            </button>
            <button
              onClick={(_) => setIsPrintMode(false)}
              className="btn btn-default"
            >
              <i className="fas fa-times mr-2"></i> Close
            </button>
          </div>
          {printData(data)}
        </div>
      ) : (
        <div className="mx-3 md:mx-8 mb-10">
          <div className="my-4 md:flex justify-between items-center mx-1">
            <PageTitle title={"Shifting details"} />
            <div className="md:flex items-center space-y-2 md:space-y-0 md:space-x-2">
              <div>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="medium"
                  onClick={() =>
                    navigate(`/shifting/${data.external_id}/update`)
                  }
                >
                  Update Status/Details
                </Button>
              </div>
              <div>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="medium"
                  onClick={() => setIsPrintMode(true)}
                >
                  <i className="fas fa-file-alt mr-2"></i> Referral Letter
                </Button>
              </div>
            </div>
          </div>
          {data.assigned_to_object && (
            <div className="relative rounded-lg shadow bg-primary-200">
              <div className="max-w-screen-xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
                <div className="pr-16 sm:text-center sm:px-16">
                  <p className="font-bold text-primary-800">
                    <span className="inline">
                      Assigned to: {data.assigned_to_object.first_name}{" "}
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
                  Patient name:{" "}
                </span>
                <Link href={`/patient/${data.patient_object?.id}`}>
                  {data.patient_object?.name}
                </Link>
              </div>
              <div>
                <span className="font-semibold leading-relaxed">Status: </span>
                <span className="badge badge-pill badge-primary py-1 px-2">
                  {data.status}
                </span>
              </div>
              <div>
                <span className="font-semibold leading-relaxed">
                  Origin facility:{" "}
                </span>
                {data.orgin_facility_object?.name || "--"}
              </div>
              <div>
                <span className="font-semibold leading-relaxed">
                  Shifting approving facility:{" "}
                </span>
                {data.shifting_approving_facility_object?.name || "--"}
              </div>
              <div>
                <span className="font-semibold leading-relaxed">
                  Assigned facility:{" "}
                </span>
                {data.assigned_facility_object?.name || "--"}
              </div>
              <div>
                <span className="font-semibold leading-relaxed">
                  Contact person at the facility:{" "}
                </span>
                {data.refering_facility_contact_name || "--"}
              </div>
              <div>
                <span className="font-semibold leading-relaxed">
                  Contact person number:{" "}
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
                  Is emergency:{" "}
                </span>
                <span className="badge badge-pill badge-danger py-1 px-2">
                  {" "}
                  {data.emergency ? "yes" : "no"}
                </span>
              </div>
              <div>
                <span className="font-semibold leading-relaxed">
                  Is up shift:{" "}
                </span>
                <span className="badge badge-pill badge-warning py-1 px-2">
                  {" "}
                  {data.is_up_shift ? "yes" : "no"}
                </span>
              </div>
              <div>
                <span className="font-semibold leading-relaxed">
                  {KASP_FULL_STRING}:{" "}
                </span>
                <span className="badge badge-pill badge-warning py-1 px-2">
                  {" "}
                  {data.is_kasp ? "yes" : "no"}
                </span>
              </div>
              <div>
                <span className="font-semibold leading-relaxed">
                  Vehicle preference:{" "}
                </span>
                {data.vehicle_preference || data.preferred_vehicle_choice}
              </div>
              <div>
                <span className="font-semibold leading-relaxed">
                  Facility preference:{" "}
                </span>
                {data.assigned_facility_type || "--"}
              </div>
              <div>
                <span className="font-semibold leading-relaxed">
                  Severity of Breathlessness:{" "}
                </span>
                {data.breathlessness_level || "--"}
              </div>

              <div className="md:row-span-2 md:col-span-2">
                <span className="font-semibold leading-relaxed">Reason: </span>
                <span className="ml-2">{data.reason || "--"}</span>
              </div>

              <div className="md:row-span-2 md:col-span-2">
                <span className="font-semibold leading-relaxed">
                  Comments:{" "}
                </span>
                <span className="ml-2">{data.comments || "--"}</span>
              </div>

              <div>
                <span className="font-semibold leading-relaxed">
                  {" "}
                  Record Created at :{" "}
                </span>
                {formatDate(data.created_date) || "--"}
              </div>

              <div>
                <span className="font-semibold leading-relaxed">
                  {" "}
                  Last Updated on :{" "}
                </span>
                {formatDate(data.modified_date) || "--"}
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <div>
                <Button
                  fullWidth
                  variant="contained"
                  color="secondary"
                  size="small"
                  onClick={() => setOpenDeleteShiftDialog(true)}
                >
                  Delete Record
                </Button>

                <Dialog
                  open={openDeleteShiftDialog}
                  onClose={() => setOpenDeleteShiftDialog(false)}
                >
                  <DialogTitle id="alert-dialog-title">
                    Authorize shift delete
                  </DialogTitle>
                  <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                      Are you sure you want to delete this record?
                    </DialogContentText>
                  </DialogContent>
                  <DialogActions>
                    <div className="flex flex-col md:flex-row w-full gap-2 justify-end">
                      <div>
                        <button
                          onClick={() => setOpenDeleteShiftDialog(false)}
                          className="btn btn-primary w-full md:w-auto"
                        >
                          No
                        </button>
                      </div>
                      <div>
                        <button
                          onClick={handleShiftDelete}
                          id="facility-delete-confirm"
                          className="btn btn-danger w-full md:w-auto"
                        >
                          Yes
                        </button>
                      </div>
                    </div>
                  </DialogActions>
                </Dialog>
              </div>
            </div>
          </div>

          <div className="md:grid grid-cols-5 gap-2">
            <div className="col-span-3">
              <div>
                <h4 className="mt-8">
                  Details of patient {showCopyToclipBoard(data)}
                </h4>
                {showPatientCard(data.patient_object)}
              </div>
              <div className="mr-3 md:mr-8 mb-10">
                <h4 className="mt-8">Comments</h4>
                <CommentSection id={props.id} />
              </div>
            </div>

            <div className="col-span-2">
              <h4 className="mt-8">Audit Log</h4>

              <div className="p-2 bg-white rounded-lg shadow text-center px-4 mt-2 grid lg:grid-cols-2">
                <div className="lg:border-r-2 border-b-2 lg:border-b-0 pb-2 lg:pb-0">
                  <div className="text-sm leading-5 font-medium text-gray-500">
                    Created
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
                    Last Edited
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
                <h4 className="mt-8">Details of orgin facility</h4>

                {showFacilityCard(data.orgin_facility_object)}
              </div>
              <div>
                <h4 className="mt-8">Details of assigned facility</h4>
                {showFacilityCard(data.assigned_facility_object)}
              </div>

              <div>
                <h4 className="mt-8">Details of shifting approving facility</h4>
                {showFacilityCard(data.shifting_approving_facility_object)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
