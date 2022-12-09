import { CircularProgress } from "@material-ui/core";
import { navigate } from "raviger";
import moment from "moment";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { GENDER_TYPES, SAMPLE_TEST_STATUS } from "../../Common/constants";
import loadable from "@loadable/component";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { OnlineUsersSelect } from "../Common/OnlineUsersSelect";
import {
  getConsultationList,
  listShiftRequests,
  getPatient,
  getSampleTestList,
  patchSample,
  patchPatient,
  completeTransfer,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications";
import AlertDialog from "../Common/AlertDialog";
import Pagination from "../Common/Pagination";
import { ConsultationCard } from "../Facility/ConsultationCard";
import { ConsultationModel } from "../Facility/models";
import { PatientModel, SampleTestModel } from "./models";
import { SampleTestCard } from "./SampleTestCard";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogTitle from "@material-ui/core/DialogTitle";
import { ErrorHelperText } from "../Common/HelperInputFields";
import Modal from "@material-ui/core/Modal";
import Chip from "../../CAREUI/display/Chip";
import { classNames, formatDate } from "../../Utils/utils";
import ButtonV2 from "../Common/components/ButtonV2";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import RelativeDateUserMention from "../Common/RelativeDateUserMention";
import CareIcon from "../../CAREUI/icons/CareIcon";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

export const PatientHome = (props: any) => {
  const { facilityId, id } = props;
  const dispatch: any = useDispatch();
  const [showShifts, setShowShifts] = useState(false);
  const [isShiftClicked, setIsShiftClicked] = useState(false);
  const [isShiftDataLoaded, setIsShiftDataLoaded] = useState(false);
  const [patientData, setPatientData] = useState<PatientModel>({});
  const [consultationListData, setConsultationListData] = useState<
    Array<ConsultationModel>
  >([]);
  const [sampleListData, setSampleListData] = useState<Array<SampleTestModel>>(
    []
  );
  const [activeShiftingData, setActiveShiftingData] = useState<Array<any>>([]);
  const [assignedVolunteerObject, setAssignedVolunteerObject] =
    useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalConsultationCount, setTotalConsultationCount] = useState(0);
  const [currentConsultationPage, setCurrentConsultationPage] = useState(1);
  const [consultationOffset, setConsultationOffset] = useState(0);
  const [totalSampleListCount, setTotalSampleListCount] = useState(0);
  const [currentSampleListPage, setCurrentSampleListPage] = useState(1);
  const [sampleListOffset, setSampleListOffset] = useState(0);
  const [isConsultationLoading, setIsConsultationLoading] = useState(false);
  const [isSampleLoading, setIsSampleLoading] = useState(false);
  const [sampleFlag, callSampleList] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<{
    status: number;
    sample: any;
  }>({ status: 0, sample: null });
  const [showAlertMessage, setAlertMessage] = useState({
    show: false,
    message: "",
    title: "",
  });
  const [modalFor, setModalFor] = useState({
    externalId: undefined,
    loading: false,
  });
  const [openAssignVolunteerDialog, setOpenAssignVolunteerDialog] =
    React.useState(false);

  const initErr: any = {};
  const errors = initErr;

  useEffect(() => {
    setAssignedVolunteerObject(patientData.assigned_to_object);
  }, [patientData.assigned_to_object]);

  const handleTransferComplete = (shift: any) => {
    setModalFor({ ...modalFor, loading: true });
    dispatch(completeTransfer({ externalId: modalFor })).then(() => {
      navigate(
        `/facility/${shift.assigned_facility}/patient/${shift.patient}/consultation`
      );
    });
  };

  const handleAssignedVolunteer = () => {
    dispatch(
      patchPatient(
        {
          assigned_to: assignedVolunteerObject
            ? assignedVolunteerObject.id
            : null,
        },
        { id: patientData.id }
      )
    ).then((response: any) => {
      if ((response || {}).status === 200) {
        const dummyPatientData = Object.assign({}, patientData);
        dummyPatientData["assigned_to"] = assignedVolunteerObject;
        setPatientData(dummyPatientData);
        if (assignedVolunteerObject)
          Notification.Success({
            msg: "Volunteer assigned successfully.",
          });
        else
          Notification.Success({
            msg: "Volunteer unassigned successfully.",
          });
        document.location.reload();
      }
    });
    setOpenAssignVolunteerDialog(false);
    if (errors["assignedVolunteer"]) delete errors["assignedVolunteer"];
  };

  const handlePatientTransfer = (value: boolean) => {
    const dummyPatientData = Object.assign({}, patientData);
    dummyPatientData["allow_transfer"] = value;

    dispatch(
      patchPatient({ allow_transfer: value }, { id: patientData.id })
    ).then((response: any) => {
      if ((response || {}).status === 200) {
        const dummyPatientData = Object.assign({}, patientData);
        dummyPatientData["allow_transfer"] = value;
        setPatientData(dummyPatientData);

        Notification.Success({
          msg: "Transfer status updated.",
        });
      }
    });
  };

  const handleVolunteerSelect = (volunteer: any) => {
    setAssignedVolunteerObject(volunteer);
  };

  const limit = 5;

  const fetchpatient = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const patientRes = await dispatch(getPatient({ id }));
      if (!status.aborted) {
        if (patientRes && patientRes.data) {
          setPatientData(patientRes.data);
        }
        setIsLoading(false);
      }
    },
    [dispatch, id]
  );

  const fetchConsultation = useCallback(
    async (status: statusType) => {
      setIsConsultationLoading(true);
      const consultationRes = await dispatch(
        getConsultationList({ patient: id, limit, offset: consultationOffset })
      );
      if (!status.aborted) {
        if (
          consultationRes &&
          consultationRes.data &&
          consultationRes.data.results
        ) {
          setConsultationListData(consultationRes.data.results);
          setTotalConsultationCount(consultationRes.data.count);
        }
        setIsConsultationLoading(false);
      }
    },
    [dispatch, id, consultationOffset]
  );

  const fetchSampleTest = useCallback(
    async (status: statusType) => {
      setIsSampleLoading(true);
      const sampleRes = await dispatch(
        getSampleTestList(
          { limit, offset: sampleListOffset },
          { patientId: id }
        )
      );
      if (!status.aborted) {
        if (sampleRes && sampleRes.data && sampleRes.data.results) {
          setSampleListData(sampleRes.data.results);
          setTotalSampleListCount(sampleRes.data.count);
        }
        setIsSampleLoading(false);
      }
    },
    [dispatch, id, sampleListOffset]
  );

  const fetchActiveShiftingData = useCallback(
    async (status: statusType) => {
      const shiftingRes = isShiftClicked
        ? await dispatch(listShiftRequests({ patient: id }, "shift-list-call"))
        : activeShiftingData;
      setIsShiftDataLoaded(isShiftClicked);
      if (!status.aborted) {
        if (shiftingRes && shiftingRes.data && shiftingRes.data.results) {
          const activeShiftingRes: any[] = shiftingRes.data.results;
          setActiveShiftingData(activeShiftingRes);
        }
      }
    },
    [dispatch, id, isShiftClicked]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchpatient(status);
    },
    [dispatch, fetchpatient]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchConsultation(status);
    },
    [dispatch, fetchConsultation]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchSampleTest(status);
    },
    [dispatch, fetchSampleTest, sampleFlag]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchActiveShiftingData(status);
    },
    [dispatch, fetchActiveShiftingData]
  );

  const handleConsultationPagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentConsultationPage(page);
    setConsultationOffset(offset);
  };

  const handleSampleListPagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentSampleListPage(page);
    setSampleListOffset(offset);
  };

  const dismissAlert = () => {
    setAlertMessage({
      show: false,
      message: "",
      title: "",
    });
  };

  const confirmApproval = (status: number, sample: any) => {
    setSelectedStatus({ status, sample });
    setAlertMessage({
      show: true,
      message: "Are you sure you want to send the sample to Collection Centre?",
      title: "Confirm",
    });
  };

  const handleApproval = async () => {
    const { status, sample } = selectedStatus;
    const sampleData = {
      id: sample.id,
      status,
      consultation: sample.consultation,
    };
    const statusName = SAMPLE_TEST_STATUS.find((i) => i.id === status)?.desc;

    const res = await dispatch(patchSample(sampleData, { id: sample.id }));
    if (res && (res.status === 201 || res.status === 200)) {
      Notification.Success({
        msg: `Request ${statusName}`,
      });
      callSampleList(!sampleFlag);
    }

    dismissAlert();
  };

  if (isLoading) {
    return <Loading />;
  }

  const patientGender = GENDER_TYPES.find(
    (i) => i.id === patientData.gender
  )?.text;

  let patientMedHis: any[] = [];
  if (
    patientData &&
    patientData.medical_history &&
    patientData.medical_history.length
  ) {
    const medHis = patientData.medical_history;
    patientMedHis = medHis.map((item: any, idx: number) => (
      <div className="sm:col-span-1" key={`med_his_${idx}`}>
        {item?.disease !== "NO" && (
          <>
            <div className="text-sm leading-5 font-semibold text-zinc-400 overflow-x-scroll">
              {item.disease}
            </div>
            <div className="mt-1 text-sm leading-5 font-medium whitespace-normal break-words overflow-x-scroll">
              {item.details}
            </div>
          </>
        )}
      </div>
    ));
  }

  let consultationList, sampleList;

  if (isConsultationLoading) {
    consultationList = <CircularProgress size={20} />;
  } else if (consultationListData.length === 0) {
    consultationList = (
      <div>
        <hr />
        <div className="p-4 text-xl text-gray-500 font-bold flex justify-center items-center border-2 border-solid border-gray-200">
          No Data Found
        </div>
      </div>
    );
  } else if (consultationListData.length > 0) {
    consultationList = consultationListData.map((itemData, idx) => (
      <ConsultationCard
        itemData={itemData}
        key={idx}
        isLastConsultation={itemData.id === patientData.last_consultation?.id}
      />
    ));
  }

  if (isSampleLoading) {
    sampleList = <CircularProgress size={20} />;
  } else if (sampleListData.length === 0) {
    sampleList = (
      <div>
        <hr />
        <div className="p-4 text-xl text-gray-500 font-bold flex justify-center items-center border-2 border-solid border-gray-200">
          No Data Found
        </div>
      </div>
    );
  } else if (sampleListData.length > 0) {
    sampleList = (
      <div className="lg:gap-4">
        {sampleListData.map((itemData, idx) => (
          <SampleTestCard
            itemData={itemData}
            key={idx}
            handleApproval={confirmApproval}
            facilityId={facilityId}
            patientId={id}
          />
        ))}
      </div>
    );
  }

  const isPatientInactive = (patientData: PatientModel, facilityId: number) => {
    return (
      !patientData.is_active ||
      !(patientData?.last_consultation?.facility === facilityId)
    );
  };

  return (
    <div className="px-2 pb-2">
      {showAlertMessage.show && (
        <AlertDialog
          title={showAlertMessage.title}
          message={showAlertMessage.message}
          handleClose={() => handleApproval()}
          handleCancel={() => dismissAlert()}
        />
      )}

      <div id="revamp">
        <PageTitle
          title={"Patient Details"}
          backUrl="/patients"
          crumbsReplacements={{
            [facilityId]: { name: patientData?.facility_object?.name },
            [id]: { name: patientData?.name },
          }}
        />

        <div className="relative mt-2">
          <div className="max-w-screen-xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
            <div className="md:flex">
              {patientData?.last_consultation?.assigned_to_object && (
                <p className="font-bold text-green-800 rounded-lg shadow bg-green-200 p-3 mx-3 flex-1 text-center flex justify-center gap-2">
                  <span className="inline">
                    Assigned Doctor:
                    {
                      patientData?.last_consultation?.assigned_to_object
                        .first_name
                    }
                    {
                      patientData?.last_consultation?.assigned_to_object
                        .last_name
                    }
                  </span>
                  {patientData?.last_consultation?.assigned_to_object
                    .alt_phone_number && (
                    <a
                      href={`https://wa.me/${patientData?.last_consultation?.assigned_to_object.alt_phone_number}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <i className="fab fa-whatsapp" /> Video Call
                    </a>
                  )}
                </p>
              )}
              {patientData.assigned_to_object && (
                <p className="font-bold text-primary-800 rounded-lg shadow bg-primary-200 mx-2 p-3 flex-1 text-center">
                  <span className="inline">
                    Assigned Volunteer:
                    {patientData.assigned_to_object.first_name}
                    {patientData.assigned_to_object.last_name}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
        {(patientData?.facility != patientData?.last_consultation?.facility ||
          (patientData.is_active &&
            patientData?.last_consultation?.discharge_date)) && (
          <div className="relative mt-2">
            <div className="max-w-screen-xl mx-auto py-3 px-3 sm:px-6 lg:px-8 rounded-lg shadow bg-red-200 ">
              <div className="text-center">
                <p className="font-bold text-red-800">
                  <i className="fas fa-exclamation-triangle mr-2" />
                  <span className="inline">
                    You have not created a consultation for the patient in
                    <strong>{patientData.facility_object?.name || "-"} </strong>
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center mt-4">
              <ButtonV2
                className="w-full"
                disabled={!patientData.is_active}
                onClick={() =>
                  navigate(
                    `/facility/${patientData?.facility}/patient/${id}/consultation`
                  )
                }
              >
                Create Consultation
              </ButtonV2>
            </div>
          </div>
        )}
        <section className="lg:flex" data-testid="patient-dashboard">
          <div className="lg:w-2/3 mx-2 h-full">
            <div className="bg-white rounded-lg shadow pt-11 pb-5 pl-9 h-full">
              <div className="flex flex-row">
                <h1 className="font-bold text-2xl pb-3 flex flex-row">
                  {patientData.name} - {patientData.age}
                </h1>
                <div className="flex flex-wrap gap-2 ml-auto mr-9">
                  {patientData.is_vaccinated ? (
                    <Chip color="blue" startIcon="syringe" text="Vaccinated" />
                  ) : (
                    <Chip
                      color="yellow"
                      startIcon="exclamation-triangle"
                      text="Not Vaccinated"
                    />
                  )}
                  {patientData.allow_transfer ? (
                    <Chip
                      color="yellow"
                      startIcon="unlock"
                      text="Transfer Allowed"
                    />
                  ) : (
                    <Chip
                      color="primary"
                      startIcon="lock"
                      text="Transfer Blocked"
                    />
                  )}
                  {patientData.gender === 2 &&
                    patientData.is_antenatal &&
                    patientData.is_active && (
                      <Chip
                        color="blue"
                        startIcon="baby-carriage"
                        text="Antenatal"
                      />
                    )}
                  {patientData.contact_with_confirmed_carrier && (
                    <Chip
                      color="red"
                      startIcon="exclamation-triangle"
                      text="Contact with confirmed carrier"
                    />
                  )}
                  {patientData.contact_with_suspected_carrier && (
                    <Chip
                      color="yellow"
                      startIcon="exclamation-triangle"
                      text="Contact with suspected carrier"
                    />
                  )}
                  {patientData.past_travel && (
                    <Chip
                      color="yellow"
                      startIcon="exclamation-triangle"
                      text="Travel (within last 28 days)"
                    />
                  )}
                  {patientData.last_consultation?.is_telemedicine && (
                    <Chip
                      color="purple"
                      startIcon="phone"
                      text="Telemedicine"
                    />
                  )}
                </div>
              </div>
              <h3 className="text-base font-medium">
                <i className="fa-regular fa-hospital mr-2 text-emerald-900" />
                {patientData.facility_object?.name || "-"}
              </h3>
              <p className="text-sm text-zinc-500 mt-4 mb-7 font-medium">
                {patientGender} | {patientData.blood_group || "-"}
              </p>
              <div className="grid grid-cols-1 gap-x-4 gap-y-2 md:gap-y-8 md:grid-cols-2 lg:grid-cols-3 mt-2 mb-8">
                <div className="sm:col-span-1">
                  <div className="text-sm leading-5 font-semibold text-zinc-400">
                    Date of Birth
                  </div>
                  <div className="mt-1 text-sm leading-5 font-medium">
                    {patientData?.date_of_birth}
                  </div>
                </div>
                <div className="sm:col-span-1">
                  <div className="text-sm leading-5 font-semibold text-zinc-400">
                    Phone
                  </div>
                  <div className="mt-1 text-sm leading-5 ">
                    <div>
                      <a
                        href={`tel:${patientData.phone_number}`}
                        className="font-medium text-sm text-black hover:text-gray-500"
                      >
                        {patientData.phone_number || "-"}
                      </a>
                    </div>
                    <div>
                      <a
                        href={`https://wa.me/${patientData.phone_number}`}
                        target="_blank"
                        className="text-sky-600 font-normal text-sm hover:text-sky-300"
                        rel="noreferrer"
                      >
                        <i className="fab fa-whatsapp " /> Chat on WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
                <div className="sm:col-span-1">
                  <div className="text-sm leading-5 font-semibold text-zinc-400">
                    Emergency Contact
                  </div>
                  <div className="mt-1 text-sm leading-5 text-gray-900">
                    <div>
                      <a
                        href={`tel:${patientData.emergency_phone_number}`}
                        className="font-medium text-sm text-black hover:text-gray-500"
                      >
                        {patientData.emergency_phone_number || "-"}
                      </a>
                    </div>
                    <div>
                      <a
                        href={`https://wa.me/${patientData.emergency_phone_number}`}
                        target="_blank"
                        className="text-sky-600 font-normal text-sm hover:text-sky-300"
                        rel="noreferrer"
                      >
                        <i className="fab fa-whatsapp" /> Chat on WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
                {patientData.date_of_return && (
                  <div className="sm:col-span-1">
                    <div className="text-sm leading-5 font-semibold text-zinc-400">
                      Date of Return
                    </div>
                    <div className="mt-1 text-sm leading-5 font-medium">
                      {formatDate(patientData.date_of_return)}
                    </div>
                  </div>
                )}
                {patientData.is_vaccinated && patientData.number_of_doses && (
                  <div className="sm:col-span-1">
                    <div className="text-sm leading-5 font-semibold text-zinc-400">
                      Number of vaccine doses
                    </div>
                    <div className="mt-1 text-sm leading-5 font-medium">
                      {patientData.number_of_doses}
                    </div>
                  </div>
                )}
                {patientData.is_vaccinated && patientData.vaccine_name && (
                  <div className="sm:col-span-1">
                    <div className="text-sm leading-5 font-semibold text-zinc-400">
                      Vaccine name
                    </div>
                    <div className="mt-1 text-sm leading-5 font-medium">
                      {patientData.vaccine_name}
                    </div>
                  </div>
                )}
                {patientData.is_vaccinated && patientData.last_vaccinated_date && (
                  <div className="sm:col-span-1">
                    <div className="text-sm leading-5 font-semibold text-zinc-400">
                      Last Vaccinated on
                    </div>
                    <div className="mt-1 text-sm leading-5 font-medium">
                      {formatDate(patientData.last_vaccinated_date)}
                    </div>
                  </div>
                )}
                {patientData.countries_travelled &&
                  !!patientData.countries_travelled.length && (
                    <div className="sm:col-span-1">
                      <div className="text-sm leading-5 font-semibold text-zinc-400">
                        Countries travelled
                      </div>
                      <div className="mt-1 text-sm leading-5 font-medium">
                        {Array.isArray(patientData.countries_travelled)
                          ? patientData.countries_travelled.join(", ")
                          : patientData.countries_travelled
                              .split(",")
                              .join(", ")}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
          <div className="lg:w-1/3 mx-2 h-full">
            <div
              id="actions"
              className="space-y-2 flex-col justify-between flex h-full"
            >
              <div>
                {/* TODO: Re-enable Review Missed | Temporary Hack for Launch */}
                {/* {patientData.review_time &&
                  !patientData.last_consultation?.discharge_date &&
                  Number(patientData.last_consultation?.review_interval) >
                    0 && (
                    <div
                      className={
                        "mt-6 lg:mt-0 mb-6 inline-flex items-center p-3 rounded-md text-xs leading-4 font-semibold w-full justify-center shadow-sm border " +
                        (moment().isBefore(patientData.review_time)
                          ? " bg-gray-100"
                          : " p-1 bg-red-600/5 text-red-600 font-normal text-sm")
                      }
                    >
                      <i className="mr-2 text-md fa-regular fa-clock" />
                      <p className="p-1">
                        {(moment().isBefore(patientData.review_time)
                          ? "Review before: "
                          : "Review Missed: ") +
                            "") + formatDate(patientData.review_time)}
                      </p>
                    </div>
                  )} */}
                <div className="p-2 bg-white rounded-sm shadow text-center mb-6">
                  <div className="flex justify-between">
                    <div className="w-1/2 border-r-2">
                      <div className="text-sm leading-5 font-normal text-gray-500">
                        COVID Status
                      </div>
                      <div className="mt-1 text-xl font-semibold leading-5 text-gray-900">
                        {patientData.disease_status}
                      </div>
                    </div>
                    <div className="w-1/2">
                      <div className="text-sm leading-5 font-normal text-gray-500">
                        Status
                      </div>
                      <div className="mt-1 text-xl font-semibold leading-5 text-gray-900">
                        {patientData.is_active ? "LIVE" : "DISCHARGED"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between p-2 bg-white rounded-sm shadow text-center px-4 mt-2">
                  <div className="w-1/2 border-r-2 pb-1">
                    <div className="text-sm leading-5 font-normal text-gray-500">
                      Created
                    </div>
                    <div className="mt-1 text-sm leading-5 text-gray-900 whitespace-normal font-semibold">
                      <div className="text-sm flex justify-center font-semibold">
                        <RelativeDateUserMention
                          actionDate={patientData.created_date}
                          user={patientData.created_by}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="w-1/2 pb-1">
                    <div className="text-sm leading-5 font-normal text-gray-500">
                      Last Edited
                    </div>
                    <div className="mt-1 text-sm leading-5 text-gray-900 whitespace-normal">
                      <div className="text-sm flex justify-center font-semibold whitespace-normal">
                        <RelativeDateUserMention
                          actionDate={patientData.modified_date}
                          user={patientData.last_edited}
                          tooltipPosition="left"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="py-2">
                {patientData.last_consultation?.discharge_reason === "EXP" && (
                  <div>
                    <ButtonV2
                      className="w-full mt-6"
                      name="death_report"
                      onClick={() => navigate(`/death_report/${id}`)}
                    >
                      <i className="fas fa-file-download mr-2" />
                      Death Report
                    </ButtonV2>
                  </div>
                )}
                <div>
                  <ButtonV2
                    className="w-full mt-4"
                    disabled={!patientData.is_active}
                    authorizeFor={NonReadOnlyUsers}
                    onClick={() =>
                      navigate(
                        `/facility/${patientData?.facility}/patient/${id}/update`
                      )
                    }
                  >
                    <CareIcon className="care-l-edit-alt text-lg" />
                    Update Details
                  </ButtonV2>
                </div>
                <div>
                  <ButtonV2
                    className="w-full mt-4"
                    disabled={
                      !consultationListData ||
                      !consultationListData.length ||
                      !patientData.is_active
                    }
                    onClick={() =>
                      handlePatientTransfer(!patientData.allow_transfer)
                    }
                    authorizeFor={NonReadOnlyUsers}
                  >
                    <CareIcon className="care-l-lock text-lg" />
                    {patientData.allow_transfer
                      ? "Disable Transfer"
                      : "Allow Transfer"}
                  </ButtonV2>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className=" bg-white rounded-lg shadow p-4 h-full space-y-2 text-gray-100 mt-7">
          <div
            className="flex justify-between border-b border-dashed cursor-pointer text-gray-900 font-semibold text-left text-lg pb-2"
            onClick={() => {
              setShowShifts(!showShifts);
              setIsShiftClicked(true);
            }}
          >
            <div>Shifting</div>
            {showShifts ? (
              <CareIcon className="care-l-angle-up text-2xl" />
            ) : (
              <CareIcon className="care-l-angle-down text-2xl" />
            )}
          </div>
          <div
            className={
              showShifts
                ? activeShiftingData.length
                  ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  : ""
                : "hidden"
            }
          >
            {activeShiftingData.length ? (
              activeShiftingData.map((shift: any) => (
                <div key={`shift_${shift.id}`} className="mx-2 ">
                  <div className="overflow-hidden shadow rounded-lg bg-white h-full">
                    <div
                      className={
                        "p-4 h-full flex flex-col justify-between " +
                        (shift.patient_object.disease_status === "POSITIVE"
                          ? "bg-red-600/5"
                          : "")
                      }
                    >
                      <div>
                        <div className="flex justify-between mt-1">
                          <div>
                            {shift.emergency && (
                              <span className="flex-shrink-0 inline-block px-2 py-0.5 text-red-800 text-xs leading-4 font-medium bg-red-100 rounded-full">
                                Emergency
                              </span>
                            )}
                          </div>
                        </div>
                        <dl className="grid grid-cols-1 gap-x-1 gap-y-2 sm:grid-cols-1">
                          <div className="sm:col-span-1">
                            <dt
                              title="Shifting status"
                              className="text-sm leading-5 font-semibold text-zinc-400 flex items-center"
                            >
                              <CareIcon className="care-l-truck mr-2 text-lg" />
                              <dd className="font-bold text-sm leading-5 text-gray-900">
                                {shift.status}
                              </dd>
                            </dt>
                          </div>
                          <div className="sm:col-span-1">
                            <dt
                              title=" Origin facility"
                              className="text-sm leading-5 font-semibold text-zinc-400 flex items-center"
                            >
                              <CareIcon className="care-l-plane-fly mr-2 text-lg" />
                              <dd className="font-bold text-sm leading-5 text-gray-900">
                                {(shift.orgin_facility_object || {})?.name}
                              </dd>
                            </dt>
                          </div>
                          <div className="sm:col-span-1">
                            <dt
                              title="Shifting approving facility"
                              className="text-sm leading-5 font-semibold text-zinc-400 flex items-center"
                            >
                              <CareIcon className="care-l-user-check mr-2 text-lg" />
                              <dd className="font-bold text-sm leading-5 text-gray-900">
                                {
                                  (
                                    shift.shifting_approving_facility_object ||
                                    {}
                                  )?.name
                                }
                              </dd>
                            </dt>
                          </div>
                          <div className="sm:col-span-1">
                            <dt
                              title=" Assigned facility"
                              className="text-sm leading-5 font-semibold text-zinc-400 flex items-center"
                            >
                              <CareIcon className="care-l-plane-arrival mr-2 text-lg" />
                              <dd className="font-bold text-sm leading-5 text-gray-900">
                                {(shift.assigned_facility_object || {})?.name ||
                                  "Yet to be decided"}
                              </dd>
                            </dt>
                          </div>

                          <div className="sm:col-span-1">
                            <dt
                              title="  Last Modified"
                              className={
                                "text-sm leading-5 font-medium flex items-center " +
                                (moment()
                                  .subtract(2, "hours")
                                  .isBefore(shift.modified_date)
                                  ? "text-gray-900"
                                  : "rounded p-1 text-red-600 font-normal")
                              }
                            >
                              <CareIcon className="care-l-stopwatch mr-2 text-lg" />
                              <dd className="font-bold text-sm leading-5">
                                {formatDate(shift.modified_date) || "--"}
                              </dd>
                            </dt>
                          </div>
                        </dl>
                      </div>
                      <div className="mt-2 flex">
                        <ButtonV2
                          className="w-full mr-2 bg-white hover:bg-gray-100"
                          variant="secondary"
                          onClick={() =>
                            navigate(`/shifting/${shift.external_id}`)
                          }
                        >
                          <CareIcon className="care-l-eye mr-2 text-lg" />
                          All Details
                        </ButtonV2>
                      </div>
                      {shift.status === "TRANSFER IN PROGRESS" &&
                        shift.assigned_facility && (
                          <div className="mt-2">
                            <ButtonV2
                              size="small"
                              className="w-full"
                              onClick={() => setModalFor(shift.external_id)}
                            >
                              TRANSFER TO RECEIVING FACILITY
                            </ButtonV2>
                            <Modal
                              open={modalFor === shift.external_id}
                              onClose={() =>
                                setModalFor({
                                  externalId: undefined,
                                  loading: false,
                                })
                              }
                            >
                              <div className="h-screen w-full absolute flex items-center justify-center bg-modal">
                                <div className="bg-white rounded shadow p-8 m-4 max-w-sm max-h-full text-center">
                                  <div className="mb-4">
                                    <h1 className="text-2xl">
                                      Confirm Transfer Complete!
                                    </h1>
                                  </div>
                                  <div className="mb-8">
                                    <p>
                                      Are you sure you want to mark this
                                      transfer as complete? The Origin facility
                                      will no longer have access to this patient
                                    </p>
                                  </div>
                                  <div className="flex gap-2 justify-center">
                                    <ButtonV2
                                      size="small"
                                      className="w-full"
                                      onClick={() => {
                                        setModalFor({
                                          externalId: undefined,
                                          loading: false,
                                        });
                                      }}
                                    >
                                      Cancel
                                    </ButtonV2>
                                    <ButtonV2
                                      size="small"
                                      className="w-full"
                                      onClick={() =>
                                        handleTransferComplete(shift)
                                      }
                                    >
                                      Confirm
                                    </ButtonV2>
                                  </div>
                                </div>
                              </div>
                            </Modal>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className=" text-center text-gray-500">
                {isShiftDataLoaded ? "No Shifting Records!" : "Loading..."}
              </div>
            )}
          </div>
        </section>

        <section className="grid lg:grid-cols-2 grid-cols-1 mt-5 gap-6">
          <div className="w-full">
            <div className="bg-white rounded-lg shadow p-7 h-full space-y-2">
              <div className="border-b border-dashed text-gray-900 font-bold text-xl pb-2">
                Location
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="sm:col-span-1">
                  <div className="text-sm leading-5 font-semibold text-zinc-400">
                    Address
                  </div>
                  <div className="mt-1 text-sm leading-5 font-medium whitespace-normal break-words">
                    {patientData.address || "-"}
                  </div>
                </div>
                <div className="sm:col-span-1">
                  <div className="text-sm leading-5 font-semibold text-zinc-400">
                    District
                  </div>
                  <div className="mt-1 text-sm leading-5 font-medium whitespace-normal break-words">
                    {patientData.district_object?.name || "-"}
                  </div>
                </div>
                <div className="sm:col-span-1">
                  <div className="text-sm leading-5 font-semibold text-zinc-400">
                    Village
                  </div>
                  <div className="mt-1 text-sm leading-5 font-medium whitespace-normal break-words">
                    {patientData.village || "-"}
                  </div>
                </div>
                <div className="sm:col-span-1">
                  <div className="text-sm leading-5 font-semibold text-zinc-400">
                    Ward
                  </div>
                  <div className="mt-1 text-sm leading-5 font-medium whitespace-normal break-words">
                    {(patientData.ward_object &&
                      patientData.ward_object.number +
                        ", " +
                        patientData.ward_object.name) ||
                      "-"}
                  </div>
                </div>
                <div className="sm:col-span-1">
                  <div className="text-sm leading-5 font-semibold text-zinc-400">
                    State, Country - Pincode
                  </div>
                  <div className="mt-1 text-sm leading-5 font-medium whitespace-normal break-words">
                    {patientData?.state_object?.name},
                    {patientData.nationality || "-"} - {patientData.pincode}
                  </div>
                </div>
                <div className="sm:col-span-1">
                  <div className="text-sm leading-5 font-semibold text-zinc-400">
                    Local Body
                  </div>
                  <div className="mt-1 text-sm leading-5 font-medium whitespace-normal break-words">
                    {patientData.local_body_object?.name || "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full">
            <div className="bg-white rounded-lg shadow p-7 h-full space-y-2">
              <div className="border-b border-dashed text-gray-900 font-bold text-xl pb-2">
                Medical
              </div>
              {!patientData.present_health &&
                !patientData.allergies &&
                !patientData.ongoing_medication &&
                !(patientData.gender === 2 && patientData.is_antenatal) &&
                !patientData.medical_history?.some(
                  (history) => history.disease !== "NO"
                ) && (
                  <div className="text-gray-500 w-full font-bold flex justify-center items-center text-xl">
                    No Medical History Available
                  </div>
                )}
              <div className="grid grid-cols-1 gap-x-4 gap-y-2 md:gap-y-8 sm:grid-cols-3 mt-2">
                {patientData.present_health && (
                  <div className="sm:col-span-1">
                    <div className="text-sm leading-5 font-semibold text-zinc-400">
                      Present Health
                    </div>
                    <div className="mt-1 text-sm leading-5 font-medium whitespace-normal break-words overflow-x-scroll">
                      {patientData.present_health}
                    </div>
                  </div>
                )}
                {patientData.ongoing_medication && (
                  <div className="sm:col-span-1">
                    <div className="text-sm leading-5 font-semibold text-zinc-400">
                      Ongoing Medications
                    </div>
                    <div className="mt-1 text-sm leading-5 font-medium whitespace-normal break-words overflow-x-scroll">
                      {patientData.ongoing_medication}
                    </div>
                  </div>
                )}
                {patientData.allergies && (
                  <div className="sm:col-span-1">
                    <div className="text-sm leading-5 font-semibold text-zinc-400">
                      Allergies
                    </div>
                    <div className="mt-1 text-sm leading-5 font-medium whitespace-normal break-words overflow-x-scroll">
                      {patientData.allergies}
                    </div>
                  </div>
                )}
                {patientData.gender === 2 && patientData.is_antenatal && (
                  <div className="sm:col-span-1">
                    <div className="text-sm leading-5 font-semibold text-zinc-400">
                      Is pregnant
                    </div>
                    <div className="mt-1 text-sm leading-5 font-medium whitespace-normal break-words">
                      Yes
                    </div>
                  </div>
                )}
                {patientMedHis}
              </div>
            </div>
          </div>
        </section>
        <section className="md:flex mt-4 space-y-2">
          <div className="hidden lg:block">
            <div className="grid grid-cols-6 xl:grid-cols-7 mt-4 gap-5">
              <div
                className={classNames(
                  "w-full rounded-lg border",
                  patientData.is_active &&
                    (!patientData?.last_consultation ||
                      patientData?.last_consultation?.discharge_date)
                    ? "hover:bg-primary-400 cursor-pointer border-green-700"
                    : "hover:cursor-not-allowed text-gray-700 border-gray-700"
                )}
                onClick={() =>
                  patientData.is_active &&
                  (!patientData?.last_consultation ||
                    patientData?.last_consultation?.discharge_date) &&
                  navigate(
                    `/facility/${patientData?.facility}/patient/${id}/consultation`
                  )
                }
              >
                <div className="bg-white rounded-lg shadow p-4 h-full space-y-2">
                  <div className="text-center">
                    <span>
                      <CareIcon className="care-l-chat-bubble-user text-5xl" />
                    </span>
                  </div>

                  <div>
                    <p className="text-center text-sm font-medium">
                      Add Consultation
                    </p>
                  </div>
                </div>
              </div>
              <div
                className="w-full"
                onClick={() => navigate(`/patient/${id}/investigation_reports`)}
              >
                <div className="bg-white rounded-lg shadow p-4 h-full space-y-2 border border-green-700 hover:bg-gray-200 hover:cursor-pointer">
                  <div className="text-green-700 text-center">
                    <span>
                      <CareIcon className="care-l-file-search-alt text-5xl" />
                    </span>
                  </div>
                  <div>
                    <p className="text-center text-sm font-medium">
                      Investigations Summary
                    </p>
                  </div>
                </div>
              </div>
              <div
                className="w-full"
                onClick={() =>
                  navigate(
                    `/facility/${patientData?.facility}/patient/${id}/files/`
                  )
                }
              >
                <div className="bg-white rounded-lg shadow p-4 h-full space-y-2 border border-green-700 hover:bg-gray-200 hover:cursor-pointer">
                  <div className="text-green-700 text-center">
                    <span>
                      <CareIcon className="care-l-file-upload text-5xl" />
                    </span>
                  </div>
                  <div>
                    <p className="text-center text-sm font-medium">
                      View/Upload Patient Files
                    </p>
                  </div>
                </div>
              </div>
              <div
                className="w-full"
                onClick={() => {
                  if (!isPatientInactive(patientData, facilityId)) {
                    navigate(`/facility/${facilityId}/patient/${id}/shift/new`);
                  }
                }}
              >
                <div
                  className={`bg-white rounded-lg shadow p-4 h-full space-y-2 border ${
                    isPatientInactive(patientData, facilityId)
                      ? " hover:cursor-not-allowed border-gray-700"
                      : " hover:bg-gray-200 hover:cursor-pointer border-green-700"
                  } `}
                >
                  <div
                    className={`${
                      isPatientInactive(patientData, facilityId)
                        ? "text-gray-700"
                        : "text-green-700"
                    }  text-center `}
                  >
                    <span>
                      <CareIcon className="care-l-ambulance text-5xl" />
                    </span>
                  </div>

                  <div>
                    <p
                      className={`${
                        isPatientInactive(patientData, facilityId) &&
                        "text-gray-700"
                      }  text-center text-sm font-medium`}
                    >
                      Shift Patient
                    </p>
                  </div>
                </div>
              </div>
              <div
                className="w-full"
                onClick={() => {
                  if (!isPatientInactive(patientData, facilityId)) {
                    navigate(
                      `/facility/${patientData?.facility}/patient/${id}/sample-test`
                    );
                  }
                }}
              >
                <div
                  className={classNames(
                    "bg-white rounded-lg shadow p-4 h-full space-y-2 border",
                    isPatientInactive(patientData, facilityId)
                      ? " hover:cursor-not-allowed border-gray-700"
                      : " hover:bg-gray-200 hover:cursor-pointer border-green-700"
                  )}
                >
                  <div
                    className={`${
                      isPatientInactive(patientData, facilityId)
                        ? " text-gray-700 "
                        : " text-green-700 "
                    } text-center  `}
                  >
                    <span>
                      <CareIcon className="care-l-medkit text-5xl" />
                    </span>
                  </div>
                  <div>
                    <p
                      className={`${
                        isPatientInactive(patientData, facilityId) &&
                        " text-gray-700 "
                      } text-center text-sm font-medium`}
                    >
                      Request Sample Test
                    </p>
                  </div>
                </div>
              </div>
              <div
                className="w-full"
                onClick={() =>
                  navigate(
                    `/facility/${patientData?.facility}/patient/${id}/notes`
                  )
                }
              >
                <div className="bg-white rounded-lg shadow p-4 h-full space-y-2 border border-green-700 hover:bg-gray-200 hover:cursor-pointer">
                  <div className="text-green-700 text-center">
                    <span>
                      <CareIcon className="care-l-clipboard-notes text-5xl" />
                    </span>
                  </div>
                  <div>
                    <p className="text-center text-sm font-medium">
                      View Patient Notes
                    </p>
                  </div>
                </div>
              </div>
              <div
                className="w-full"
                onClick={() => {
                  if (!isPatientInactive(patientData, facilityId)) {
                    setOpenAssignVolunteerDialog(true);
                  }
                }}
              >
                <div
                  className={classNames(
                    "bg-white rounded-lg shadow p-4 h-full space-y-2 border",
                    isPatientInactive(patientData, facilityId)
                      ? "hover:cursor-not-allowed border-gray-700"
                      : "hover:bg-gray-200 hover:cursor-pointer border-green-700"
                  )}
                >
                  <div
                    className={classNames(
                      "text-center",
                      isPatientInactive(patientData, facilityId)
                        ? "text-gray-700"
                        : "text-green-700"
                    )}
                  >
                    <span>
                      <CareIcon className="care-l-users-alt text-5xl" />
                    </span>
                  </div>
                  <div>
                    <p
                      className={classNames(
                        "text-center text-sm font-medium",
                        isPatientInactive(patientData, facilityId)
                          ? "text-gray-700"
                          : "text-black"
                      )}
                    >
                      Assign to a volunteer
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full mx-2 lg:hidden">
            <div className="bg-white rounded-lg shadow p-4 h-full space-y-2">
              <div className="border-b border-dashed text-gray-900 font-semibold text-left text-lg space-y-2">
                <div>
                  <ButtonV2
                    className="w-full justify-start"
                    disabled={
                      !(
                        patientData.is_active &&
                        (!patientData?.last_consultation ||
                          patientData?.last_consultation?.discharge_date)
                      )
                    }
                    onClick={() =>
                      navigate(
                        `/facility/${patientData?.facility}/patient/${id}/consultation`
                      )
                    }
                  >
                    <CareIcon className="care-l-chat-bubble-user text-5xl text-green-700 mr-2" />
                    Add Consultation
                  </ButtonV2>
                </div>
                <div>
                  <ButtonV2
                    className="w-full justify-start"
                    onClick={() =>
                      navigate(`/patient/${id}/investigation_reports`)
                    }
                  >
                    <CareIcon className="care-l-file-search-alt text-5xl mr-2" />
                    Investigations Summary
                  </ButtonV2>
                </div>
                <div>
                  <ButtonV2
                    className="w-full justify-start"
                    onClick={() =>
                      navigate(
                        `/facility/${patientData?.facility}/patient/${id}/files`
                      )
                    }
                  >
                    <CareIcon className="care-l-file-upload text-5xl mr-2" />
                    View/Upload Patient Files
                  </ButtonV2>
                </div>
                <div>
                  <ButtonV2
                    className="w-full justify-start"
                    disabled={isPatientInactive(patientData, facilityId)}
                    onClick={() =>
                      navigate(
                        `/facility/${facilityId}/patient/${id}/shift/new`
                      )
                    }
                    authorizeFor={NonReadOnlyUsers}
                  >
                    <CareIcon className="care-l-ambulance text-5xl mr-2" />
                    SHIFT PATIENT
                  </ButtonV2>
                </div>
                <div>
                  <ButtonV2
                    className="w-full justify-start"
                    disabled={isPatientInactive(patientData, facilityId)}
                    onClick={() =>
                      navigate(
                        `/facility/${patientData?.facility}/patient/${id}/sample-test`
                      )
                    }
                    authorizeFor={NonReadOnlyUsers}
                  >
                    <CareIcon className="care-l-medkit text-5xl mr-2" />
                    Request Sample Test
                  </ButtonV2>
                </div>
                <div>
                  <ButtonV2
                    className="w-full justify-start"
                    onClick={() =>
                      navigate(
                        `/facility/${patientData?.facility}/patient/${id}/notes`
                      )
                    }
                  >
                    <CareIcon className="care-l-clipboard-notes text-5xl mr-2" />
                    View Patient Notes
                  </ButtonV2>
                </div>
                <div>
                  <ButtonV2
                    className="w-full justify-start"
                    onClick={() => setOpenAssignVolunteerDialog(true)}
                    disabled={false}
                    authorizeFor={NonReadOnlyUsers}
                  >
                    <CareIcon className="care-l-users-alt mr-2 text-5xl" />
                    Assign to a volunteer
                  </ButtonV2>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Dialog
        maxWidth={"md"}
        open={openAssignVolunteerDialog}
        onClose={() => setOpenAssignVolunteerDialog(false)}
      >
        <div className="mx-10 my-5">
          <DialogTitle id="form-dialog-title">
            Assign a volunteer to {patientData.name}
          </DialogTitle>

          <div>
            <OnlineUsersSelect
              userId={assignedVolunteerObject?.id || patientData.assigned_to}
              selectedUser={assignedVolunteerObject}
              onSelect={handleVolunteerSelect}
              user_type={"Volunteer"}
              outline={false}
            />
            <ErrorHelperText error={errors.assignedVolunteer} />
          </div>

          <DialogActions>
            <ButtonV2
              variant="secondary"
              onClick={() => {
                handleVolunteerSelect(patientData.assigned_to_object);
                setOpenAssignVolunteerDialog(false);
              }}
            >
              Cancel
            </ButtonV2>
            <ButtonV2 onClick={handleAssignedVolunteer}>Submit</ButtonV2>
          </DialogActions>
        </div>
      </Dialog>

      <div>
        <h2 className="font-semibold text-2xl leading-tight ml-0 mt-9">
          Consultation History
        </h2>
        {consultationList}
        {!isConsultationLoading && totalConsultationCount > limit && (
          <div className="mt-4 flex w-full justify-center">
            <Pagination
              cPage={currentConsultationPage}
              defaultPerPage={limit}
              data={{ totalCount: totalConsultationCount }}
              onChange={handleConsultationPagination}
            />
          </div>
        )}
      </div>

      <div>
        <h2 className="font-semibold text-2xl leading-tight ml-0 my-4">
          Sample Test History
        </h2>
        {sampleList}
        {!isSampleLoading && totalSampleListCount > limit && (
          <div className="mt-4 flex w-full justify-center">
            <Pagination
              cPage={currentSampleListPage}
              defaultPerPage={limit}
              data={{ totalCount: totalSampleListCount }}
              onChange={handleSampleListPagination}
            />
          </div>
        )}
      </div>
    </div>
  );
};
