import { navigate } from "raviger";
import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import loadable from "@loadable/component";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import {
  BED_TYPES,
  DOCTOR_SPECIALIZATION,
  FACILITY_FEATURE_TYPES,
  USER_TYPES,
} from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  getPermittedFacility,
  deleteFacility,
  getTriageInfo,
  listCapacity,
  listDoctor,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import BedTypeCard from "./BedTypeCard";
import DoctorsCountCard from "./DoctorsCountCard";
import {
  CapacityModal,
  DoctorModal,
  FacilityModel,
  PatientStatsModel,
} from "./models";
import moment from "moment";
import CoverImageEditModal from "./CoverImageEditModal";
import DropdownMenu, { DropdownItem } from "../Common/components/Menu";
import Table from "../Common/components/Table";
import ButtonV2 from "../Common/components/ButtonV2";
import { PatientIcon } from "../TeleIcu/Icons/PatientIcon";
import AuthorizeFor, { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import ContactLink from "../Common/components/ContactLink";
import CareIcon from "../../CAREUI/icons/CareIcon";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

export const getFacilityFeatureIcon = (featureId: number) => {
  const feature = FACILITY_FEATURE_TYPES.find((f) => f.id === featureId);
  if (!feature?.icon) return null;
  return typeof feature.icon === "string" ? (
    <CareIcon className={`care-l-${feature.icon} h-5`} />
  ) : (
    feature.icon
  );
};

export const FacilityHome = (props: any) => {
  const { facilityId } = props;
  const dispatch: any = useDispatch();
  const [facilityData, setFacilityData] = useState<FacilityModel>({});
  const [capacityData, setCapacityData] = useState<Array<CapacityModal>>([]);
  const [doctorData, setDoctorData] = useState<Array<DoctorModal>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editCoverImage, setEditCoverImage] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now());
  const [patientStatsData, setPatientStatsData] = useState<
    Array<PatientStatsModel>
  >([]);

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const facilityRes = await dispatch(getPermittedFacility(facilityId));
      if (facilityRes) {
        const [capacityRes, doctorRes, triageRes] = await Promise.all([
          dispatch(listCapacity({}, { facilityId })),
          dispatch(listDoctor({}, { facilityId })),
          dispatch(getTriageInfo({ facilityId })),
        ]);
        if (!status.aborted) {
          setIsLoading(false);
          if (!facilityRes.data) {
            Notification.Error({
              msg: "Something went wrong..!",
            });
          } else {
            setFacilityData(facilityRes.data);
            if (capacityRes && capacityRes.data) {
              setCapacityData(capacityRes.data.results);
            }
            if (doctorRes && doctorRes.data) {
              setDoctorData(doctorRes.data.results);
            }
            if (
              triageRes &&
              triageRes.data &&
              triageRes.data.results &&
              triageRes.data.results.length
            ) {
              setPatientStatsData(triageRes.data.results);
            }
          }
        }
      } else {
        navigate("/not-found");
        setIsLoading(false);
      }
    },
    [dispatch, facilityId]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [dispatch, fetchData]
  );

  const handleDeleteClose = () => {
    setOpenDeleteDialog(false);
  };

  const handleDeleteSubmit = async () => {
    const res = await dispatch(deleteFacility(facilityId));
    if (res?.status === 204) {
      Notification.Success({
        msg: "Facility deleted successfully",
      });
    } else {
      Notification.Error({
        msg: "Error while deleting Facility: " + (res?.data?.detail || ""),
      });
    }
    navigate("/facility");
  };

  const state: any = useSelector((state) => state);
  const { currentUser } = state;

  if (isLoading) {
    return <Loading />;
  }
  let capacityList: any = null;
  if (!capacityData || !capacityData.length) {
    capacityList = (
      <h5 className="mt-4 text-xl text-gray-500 font-bold flex items-center justify-center bg-white rounded-lg shadow p-4 w-full">
        No Bed Types Found
      </h5>
    );
  } else {
    capacityList = (
      <div className="mt-4 grid lg:grid-cols-3 sm:grid-cols-2 gap-7 w-full">
        {BED_TYPES.map((x) => {
          const res = capacityData.find((data) => {
            return data.room_type === x.id;
          });
          if (res) {
            const removeCurrentBedType = (bedTypeId: number | undefined) => {
              setCapacityData((state) =>
                state.filter((i) => i.id !== bedTypeId)
              );
            };
            return (
              <BedTypeCard
                facilityId={facilityId}
                key={`bed_${res.id}`}
                {...res}
                removeBedType={removeCurrentBedType}
              />
            );
          }
        })}
      </div>
    );
  }

  let doctorList: any = null;
  if (!doctorData || !doctorData.length) {
    doctorList = (
      <h5 className="text-xl text-gray-500 font-bold flex items-center justify-center bg-white rounded-lg shadow p-4 w-full">
        No Doctors Found
      </h5>
    );
  } else {
    doctorList = (
      <div className="mt-4 grid xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2 gap-6">
        {doctorData.map((data: DoctorModal) => {
          const removeCurrentDoctorData = (doctorId: number | undefined) => {
            setDoctorData((state) =>
              state.filter((i: DoctorModal) => i.id !== doctorId)
            );
          };

          return (
            <DoctorsCountCard
              facilityId={facilityId}
              key={`bed_${data.id}`}
              {...data}
              removeDoctor={removeCurrentDoctorData}
            />
          );
        })}
      </div>
    );
  }

  const stats: (string | JSX.Element)[][] = [];
  for (let i = 0; i < patientStatsData.length; i++) {
    const temp: (string | JSX.Element)[] = [];
    temp.push(String(patientStatsData[i].entry_date) || "0");
    temp.push(String(patientStatsData[i].num_patients_visited) || "0");
    temp.push(String(patientStatsData[i].num_patients_home_quarantine) || "0");
    temp.push(String(patientStatsData[i].num_patients_isolation) || "0");
    temp.push(String(patientStatsData[i].num_patient_referred) || "0");
    temp.push(
      String(patientStatsData[i].num_patient_confirmed_positive) || "0"
    );
    temp.push(
      <ButtonV2
        variant="secondary"
        ghost
        border
        onClick={() =>
          navigate(`/facility/${facilityId}/triage/${patientStatsData[i].id}`)
        }
        authorizeFor={NonReadOnlyUsers}
      >
        Edit
      </ButtonV2>
    );
    stats.push(temp);
  }

  const hasCoverImage = !!facilityData.read_cover_image_url;

  const StaffUserTypeIndex = USER_TYPES.findIndex((type) => type === "Staff");
  const hasPermissionToEditCoverImage =
    !(currentUser.data.user_type as string).includes("ReadOnly") &&
    USER_TYPES.findIndex((type) => type == currentUser.data.user_type) >=
      StaffUserTypeIndex;

  const editCoverImageTooltip = hasPermissionToEditCoverImage && (
    <div className="transition-[opacity] flex flex-col justify-center items-center bg-black opacity-0 h-48 md:h-[88px] w-full absolute top-0 right-0 hover:opacity-60 z-10 text-gray-300 text-sm">
      <i className="fa-solid fa-pen" />
      <span className="mt-2">{`${hasCoverImage ? "Edit" : "Upload"}`}</span>
    </div>
  );

  const CoverImage = () => (
    <img
      src={`${facilityData.read_cover_image_url}?imgKey=${imageKey}`}
      alt={facilityData.name}
      className="w-full h-full object-cover"
    />
  );

  return (
    <div className="px-2 pb-2">
      <PageTitle
        title={facilityData.name || "Facility"}
        crumbsReplacements={{ [facilityId]: { name: facilityData.name } }}
        focusOnLoad={true}
      />
      <Dialog
        maxWidth={"md"}
        open={openDeleteDialog}
        onClose={handleDeleteClose}
      >
        <DialogTitle className="flex justify-center bg-red-100">
          Are you sure you want to delete {facilityData.name || "Facility"}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            You will not be able to access this facility after it is deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <div className="flex flex-col md:flex-row gap-2 w-full justify-between">
            <button
              onClick={handleDeleteClose}
              className="btn btn-primary w-full md:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteSubmit}
              id="facility-delete-confirm"
              className="btn btn-danger w-full md:w-auto"
            >
              Delete
            </button>
          </div>
        </DialogActions>
      </Dialog>
      <CoverImageEditModal
        open={editCoverImage}
        onSave={() =>
          facilityData.read_cover_image_url
            ? setImageKey(Date.now())
            : window.location.reload()
        }
        onClose={() => setEditCoverImage(false)}
        onDelete={() => window.location.reload()}
        facility={facilityData}
      />
      {hasCoverImage ? (
        <div
          className={`group relative overflow-clip w-full rounded-t bg-gray-200 h-48 md:h-0 opacity-100 md:opacity-0 transition-all duration-200 ease-in-out ${
            hasPermissionToEditCoverImage && "cursor-pointer"
          }`}
          onClick={() =>
            hasPermissionToEditCoverImage && setEditCoverImage(true)
          }
        >
          <CoverImage />
          {editCoverImageTooltip}
        </div>
      ) : (
        <div
          className={`group md:hidden flex w-full self-stretch shrink-0 bg-gray-300 items-center justify-center relative z-0 ${
            hasPermissionToEditCoverImage && "cursor-pointer"
          }`}
          onClick={() =>
            hasPermissionToEditCoverImage && setEditCoverImage(true)
          }
        >
          <i
            className="fas fa-hospital text-4xl block text-gray-500 p-10"
            aria-hidden="true"
          ></i>
          {editCoverImageTooltip}
        </div>
      )}
      <div
        className={`bg-white ${
          hasCoverImage ? "rounded-b lg:rounded-t" : "rounded"
        } p-3 md:p-6 shadow-sm transition-all duration-200 ease-in-out`}
      >
        <div className="lg:flex justify-between gap-2">
          <div className="md:flex flex-col justify-between">
            <div className="flex flex-col flex-1 gap-10">
              <div className="flex gap-4 items-center">
                <div
                  className={`group relative h-[88px] w-[88px] hidden md:flex transition-all duration-200 ease-in-out rounded overflow-clip ${
                    hasPermissionToEditCoverImage && "cursor-pointer"
                  }`}
                  onClick={() =>
                    hasPermissionToEditCoverImage && setEditCoverImage(true)
                  }
                >
                  {hasCoverImage ? (
                    <CoverImage />
                  ) : (
                    <div className="h-[88px] w-full bg-gray-200 text-gray-700 flex items-center justify-center font-medium">
                      <svg
                        className="w-8 h-8 fill-current text-gray-500"
                        viewBox="0 0 40 32"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M18.5 6C18.5 5.4475 18.95 5 19.5 5H20.5C21.05 5 21.5 5.4475 21.5 6V7.5H23C23.55 7.5 24 7.95 24 8.5V9.5C24 10.05 23.55 10.5 23 10.5H21.5V12C21.5 12.55 21.05 13 20.5 13H19.5C18.95 13 18.5 12.55 18.5 12V10.5H17C16.45 10.5 16 10.05 16 9.5V8.5C16 7.95 16.45 7.5 17 7.5H18.5V6ZM25.5 0C27.9875 0 30 2.015 30 4.5V5H35.5C37.9875 5 40 7.0125 40 9.5V27.5C40 29.9875 37.9875 32 35.5 32H4.49875C2.01188 32 0 29.9875 0 27.5V9.5C0 7.0125 2.015 5 4.5 5H10V4.5C10 2.015 12.0125 0 14.5 0H25.5ZM30 8V29H35.5C36.3312 29 37 28.3313 37 27.5V21H33.5C32.6688 21 32 20.3313 32 19.5C32 18.6688 32.6688 18 33.5 18H37V15H33.5C32.6688 15 32 14.3313 32 13.5C32 12.6688 32.6688 12 33.5 12H37V9.5C37 8.66875 36.3312 8 35.5 8H30ZM3 9.5V12H6.5C7.33125 12 8 12.6688 8 13.5C8 14.3313 7.33125 15 6.5 15H3V18H6.5C7.33125 18 8 18.6688 8 19.5C8 20.3313 7.33125 21 6.5 21H3V27.5C3 28.3313 3.67125 29 4.49875 29H10V8H4.5C3.67188 8 3 8.66875 3 9.5ZM13 29H17V25C17 23.3438 18.3438 22 20 22C21.6562 22 23 23.3438 23 25V29H27V4.5C27 3.67188 26.3312 3 25.5 3H14.5C13.6688 3 13 3.67188 13 4.5V29Z" />
                      </svg>
                    </div>
                  )}
                  {editCoverImageTooltip}
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{facilityData.name}</h1>
                  <p className="mt-1 text-sm text-gray-700">
                    Last updated:{" "}
                    {facilityData?.modified_date &&
                      moment(facilityData?.modified_date).fromNow()}
                  </p>
                </div>
              </div>
              <div className="flex items-center flex-1">
                <div className="grid grid-cols-1  lg:grid-cols-2 gap-4 mb-6 md:mb-0 w-full">
                  <div className="md:flex flex-col justify-between lg:flex-1 ">
                    <div className="mb-10">
                      <h1 className="font-semibold text-[#B9B9B9] text-base">
                        Address
                      </h1>
                      <p className="font-medium text-base">
                        {facilityData.address}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div>
                        <h1 className="text-base font-semibold text-[#B9B9B9]">
                          Phone Number
                        </h1>
                        <ContactLink tel={String(facilityData.phone_number)} />
                      </div>
                    </div>
                  </div>
                  <div className="lg:flex-1 min-w-[300px] md:flex flex-col">
                    <div className="mb-10">
                      <h1 className="text-base font-semibold text-[#B9B9B9]">
                        Local Body
                      </h1>
                      <p className="text-base font-medium w-2/3 md:w-full">
                        {facilityData?.local_body_object?.name}
                      </p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-10">
                      <div>
                        <h1 className="text-base font-semibold text-[#B9B9B9]">
                          Ward
                        </h1>
                        <p className="text-base font-medium">
                          {facilityData?.ward_object?.number +
                            ", " +
                            facilityData?.ward_object?.name}
                        </p>
                      </div>
                      <div>
                        <h1 className="text-base font-semibold text-[#B9B9B9]">
                          District
                        </h1>
                        <p className="text-base font-medium">
                          {facilityData?.district_object?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-10">
              <div>
                {facilityData.features?.some((feature) =>
                  FACILITY_FEATURE_TYPES.some((f) => f.id === feature)
                ) && (
                  <h1 className="text-lg font-semibold">Available features</h1>
                )}
                <div className="flex gap-2 flex-wrap mt-5">
                  {facilityData.features?.map(
                    (feature, i) =>
                      FACILITY_FEATURE_TYPES.some((f) => f.id === feature) && (
                        <div
                          key={i}
                          className="flex items-center gap-1 bg-[#F0FFF9] text-primary-500 font-medium px-3.5 py-2.5 rounded border border-primary-500 text-sm"
                        >
                          {getFacilityFeatureIcon(feature)}
                          &nbsp;
                          {
                            FACILITY_FEATURE_TYPES.filter(
                              (f) => f.id === feature
                            )[0]?.name
                          }
                        </div>
                      )
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between mt-4">
            <div className="w-full md:w-auto">
              <DropdownMenu
                id="manage-facility-dropdown"
                title="Manage Facility"
                icon={<CareIcon className="care-l-setting h-5" />}
              >
                <DropdownItem
                  id="update-facility"
                  onClick={() => navigate(`/facility/${facilityId}/update`)}
                  authorizeFor={NonReadOnlyUsers}
                  icon={<CareIcon className="care-l-edit-alt h-5" />}
                >
                  Update Facility
                </DropdownItem>
                <DropdownItem
                  id="configure-facility"
                  onClick={() =>
                    navigate(`/facility/${facilityId}/middleware/update`)
                  }
                  authorizeFor={NonReadOnlyUsers}
                  icon={<CareIcon className="care-l-setting h-5" />}
                >
                  Configure Facility
                </DropdownItem>
                <DropdownItem
                  id="inventory-management"
                  onClick={() => navigate(`/facility/${facilityId}/inventory`)}
                  icon={<CareIcon className="care-l-clipboard-alt w-5 " />}
                >
                  Inventory Management
                </DropdownItem>
                <DropdownItem
                  id="location-management"
                  onClick={() => navigate(`/facility/${facilityId}/location`)}
                  authorizeFor={NonReadOnlyUsers}
                  icon={<CareIcon className="care-l-location-point h-5" />}
                >
                  Location Management
                </DropdownItem>
                <DropdownItem
                  onClick={() =>
                    navigate(`/facility/${facilityId}/resource/new`)
                  }
                  authorizeFor={NonReadOnlyUsers}
                  icon={<CareIcon className="care-l-gold h-5" />}
                >
                  Resource Request
                </DropdownItem>
                <DropdownItem
                  onClick={() => navigate(`/facility/${facilityId}/assets/new`)}
                  authorizeFor={NonReadOnlyUsers}
                  icon={<CareIcon className="care-l-plus-circle h-5" />}
                >
                  Create Asset
                </DropdownItem>
                <DropdownItem
                  onClick={() => navigate(`/assets?facility=${facilityId}`)}
                  icon={<CareIcon className="care-l-medkit h-5" />}
                >
                  View Assets
                </DropdownItem>
                <DropdownItem
                  onClick={() => navigate(`/facility/${facilityId}/users`)}
                  icon={<CareIcon className="care-l-users-alt h-5" />}
                >
                  View Users
                </DropdownItem>
                <DropdownItem
                  variant="danger"
                  onClick={() => setOpenDeleteDialog(true)}
                  className="flex gap-3 items-center"
                  icon={<CareIcon className="care-l-trash-alt h-5" />}
                  authorizeFor={AuthorizeFor(["DistrictAdmin", "StateAdmin"])}
                >
                  Delete Facility
                </DropdownItem>
              </DropdownMenu>
            </div>
            <div className="flex flex-col justify-end">
              <ButtonV2
                variant="primary"
                ghost
                border
                className="mt-2 w-full md:w-auto"
                onClick={() => navigate(`/facility/${facilityId}/patient`)}
                authorizeFor={NonReadOnlyUsers}
              >
                <CareIcon className="care-l-plus h-5" />
                <span className="text-sm">Add Details of a Patient</span>
              </ButtonV2>
              <ButtonV2
                variant="primary"
                ghost
                border
                className="mt-2 w-full md:w-auto py-3"
                onClick={() => navigate(`/facility/${facilityId}/patients`)}
              >
                <PatientIcon className="w-4 h-4 fill-current" />
                View Patients
              </ButtonV2>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded p-3 md:p-6 shadow-sm mt-5">
        <h1 className="text-xl font-bold mb-6">Oxygen Information</h1>
        <div className="overflow-x-auto overflow-y-hidden">
          <Table
            headings={[
              "",
              "Oxygen capacity",
              "Type B cylinder",
              "Type C cylinder",
              "Type D cylinder",
            ]}
            rows={[
              [
                "Capacity",
                String(facilityData.oxygen_capacity),
                String(facilityData.type_b_cylinders),
                String(facilityData.type_c_cylinders),
                String(facilityData.type_d_cylinders),
              ],
              [
                "Daily Expected Consumption",
                String(facilityData.expected_oxygen_requirement),
                String(facilityData.expected_type_b_cylinders),
                String(facilityData.expected_type_c_cylinders),
                String(facilityData.expected_type_d_cylinders),
              ],
            ]}
          />
        </div>
      </div>
      <div className="bg-white rounded p-3 md:p-6 shadow-sm mt-5">
        <div className="md:flex justify-between  md:border-b md:pb-2">
          <div className="font-semibold text-xl mb-2">Bed Capacity</div>
          <ButtonV2
            className="w-full md:w-auto"
            onClick={() => navigate(`/facility/${facilityId}/bed`)}
            authorizeFor={NonReadOnlyUsers}
          >
            <i className="fas fa-bed text-white mr-2" />
            Add More Bed Types
          </ButtonV2>
        </div>
        <div>{capacityList}</div>
      </div>
      <div className="bg-white rounded p-3 md:p-6 shadow-sm mt-5">
        <div className="md:flex justify-between md:pb-2">
          <div className="font-bold text-xl mb-2">Doctors List</div>
          <ButtonV2
            className="w-full md:w-auto"
            onClick={() => navigate(`/facility/${facilityId}/doctor`)}
            disabled={doctorList.length === DOCTOR_SPECIALIZATION.length}
            authorizeFor={NonReadOnlyUsers}
          >
            <i className="fas fa-user-md text-white mr-2" />
            Add Doctor Types
          </ButtonV2>
        </div>
        <div className="mt-4">{doctorList}</div>
      </div>
      <div className="bg-white rounded p-3 md:p-6 shadow-sm mt-5">
        <div className="-my-2 py-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="md:flex justify-between md:pb-2">
            <div className="text-xl font-bold mb-2">Corona Triage</div>
            <ButtonV2
              className="w-full md:w-auto"
              onClick={() => navigate(`/facility/${facilityId}/triage`)}
              authorizeFor={NonReadOnlyUsers}
            >
              <i className="fas fa-notes-medical text-white mr-2" />
              Add Triage
            </ButtonV2>
          </div>
          <div className="mt-4 overflow-x-auto overflow-y-hidden">
            <Table
              rows={stats}
              headings={[
                "Date",
                "Total Triaged",
                "Advised Home Quarantine",
                "Suspects Isolated",
                "Referred",
                "Confirmed positives",
                "Actions",
              ]}
            />
            {stats.length === 0 && (
              <div>
                <hr />
                <div className="p-4 text-xl text-gray-600 border rounded-sm border-[#D2D6DC] mt-3 font-bold flex justify-center items-center">
                  No Data Found
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
