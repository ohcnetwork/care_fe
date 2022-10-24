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
import { RoleButton } from "../Common/RoleButton";
import DropdownMenu, { DropdownItem } from "../Common/components/Menu";
import Table from "../Common/components/Table";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

export const FacilityHome = (props: any) => {
  const { facilityId } = props;
  const dispatch: any = useDispatch();
  const [facilityData, setFacilityData] = useState<FacilityModel>({});
  const [capacityData, setCapacityData] = useState<Array<CapacityModal>>([]);
  const [doctorData, setDoctorData] = useState<Array<DoctorModal>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
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
      <h5 className="text-xl text-gray-500 font-bold flex items-center justify-center bg-white rounded-lg shadow p-4 w-full">
        No Bed Types Found
      </h5>
    );
  } else {
    capacityList = BED_TYPES.map((x) => {
      const res = capacityData.find((data) => {
        return data.room_type === x.id;
      });
      if (res) {
        const removeCurrentBedType = (bedTypeId: number | undefined) => {
          setCapacityData((state) => state.filter((i) => i.id !== bedTypeId));
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
    });
  }

  let doctorList: any = null;
  if (!doctorData || !doctorData.length) {
    doctorList = (
      <h5 className="text-xl text-gray-500 font-bold flex items-center justify-center bg-white rounded-lg shadow p-4 w-full">
        No Doctors Found
      </h5>
    );
  } else {
    doctorList = doctorData.map((data: DoctorModal) => {
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
    });
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
      <RoleButton
        className="btn btn-default"
        handleClickCB={() =>
          navigate(`/facility/${facilityId}/triage/${patientStatsData[i].id}`)
        }
        disableFor="readOnly"
        buttonType="html"
      >
        Edit
      </RoleButton>
    );
    stats.push(temp);
  }

  return (
    <div className="px-2 pb-2">
      <PageTitle
        title={facilityData.name || "Facility"}
        crumbsReplacements={{ [facilityId]: { name: facilityData.name } }}
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
      <div className="bg-white rounded p-3 md:p-6 shadow">
        <div className="lg:flex justify-between gap-2">
          <div className="md:flex flex-col justify-between">
            <div className="flex flex-col flex-1 gap-3">
              <div>
                <h1 className="text-4xl font-bold">{facilityData.name}</h1>
                <p className="mt-1 text-sm text-gray-700">
                  Last updated{" "}
                  {facilityData?.modified_date &&
                    moment(facilityData?.modified_date).fromNow()}
                </p>
              </div>
              <div className="flex items-center flex-1">
                <div className="grid grid-cols-1  lg:grid-cols-2 gap-4 mb-6 md:mb-0 w-full">
                  <div className="md:flex flex-col justify-between lg:flex-1 ">
                    <div className="mb-4">
                      <h1 className="text-lg font-bold">Address</h1>
                      <p className="text-lg">{facilityData.address}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div>
                        <h1 className="text-lg font-bold">Phone Number</h1>
                        <a
                          href={`tel:${facilityData.phone_number}`}
                          className="block text-lg font-normal"
                        >
                          {facilityData.phone_number}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="lg:flex-1 min-w-[300px] md:flex flex-col">
                    <div className="mb-4">
                      <h1 className="text-lg font-bold">Local Body</h1>
                      <p className="text-lg w-2/3 md:w-full">
                        {facilityData?.local_body_object?.name}
                      </p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div>
                        <h1 className="text-lg font-bold">Ward</h1>
                        <p className="text-lg">
                          {facilityData?.ward_object?.number +
                            ", " +
                            facilityData?.ward_object?.name}
                        </p>
                      </div>
                      <div>
                        <h1 className="text-lg font-bold">District</h1>
                        <p className="text-lg">
                          {facilityData?.district_object?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <div>
                {facilityData.features?.some((feature) =>
                  FACILITY_FEATURE_TYPES.some((f) => f.id === feature)
                ) && <h1 className="text-lg font-bold">Features</h1>}
                <div className="flex gap-2 flex-wrap mt-2">
                  {facilityData.features?.map(
                    (feature, i) =>
                      FACILITY_FEATURE_TYPES.some((f) => f.id === feature) && (
                        <div
                          key={i}
                          className="bg-primary-100 text-primary-600 font-semibold px-3 py-1 rounded-full border border-primary-600 text-sm"
                        >
                          <i
                            className={`fas fa-${
                              FACILITY_FEATURE_TYPES.filter(
                                (f) => f.id === feature
                              )[0]?.icon
                            }`}
                          />{" "}
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
                title="Manage Facility"
                icon={
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 21 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18.8999 11.66C18.7396 11.4775 18.6512 11.2429 18.6512 11C18.6512 10.7571 18.7396 10.5225 18.8999 10.34L20.1799 8.90002C20.3209 8.74269 20.4085 8.54472 20.4301 8.33452C20.4516 8.12433 20.4061 7.9127 20.2999 7.73002L18.2999 4.27002C18.1948 4.08754 18.0348 3.94289 17.8426 3.8567C17.6505 3.77051 17.4361 3.74718 17.2299 3.79002L15.3499 4.17002C15.1107 4.21945 14.8616 4.17961 14.6498 4.05802C14.4379 3.93643 14.2779 3.7415 14.1999 3.51002L13.5899 1.68002C13.5228 1.4814 13.395 1.30888 13.2245 1.18686C13.0541 1.06484 12.8495 0.999476 12.6399 1.00002H8.6399C8.42183 0.988635 8.20603 1.04894 8.02546 1.17173C7.84489 1.29452 7.70948 1.47304 7.6399 1.68002L7.0799 3.51002C7.0019 3.7415 6.84187 3.93643 6.63001 4.05802C6.41815 4.17961 6.16911 4.21945 5.9299 4.17002L3.9999 3.79002C3.80445 3.7624 3.6052 3.79324 3.42724 3.87866C3.24929 3.96407 3.1006 4.10025 2.9999 4.27002L0.999896 7.73002C0.891056 7.91067 0.842118 8.1211 0.860079 8.33124C0.878039 8.54138 0.961979 8.74046 1.0999 8.90002L2.3699 10.34C2.53022 10.5225 2.61863 10.7571 2.61863 11C2.61863 11.2429 2.53022 11.4775 2.3699 11.66L1.0999 13.1C0.961979 13.2596 0.878039 13.4587 0.860079 13.6688C0.842118 13.8789 0.891056 14.0894 0.999896 14.27L2.9999 17.73C3.10499 17.9125 3.26502 18.0571 3.45715 18.1433C3.64928 18.2295 3.86372 18.2529 4.0699 18.21L5.9499 17.83C6.18911 17.7806 6.43815 17.8204 6.65001 17.942C6.86187 18.0636 7.0219 18.2585 7.0999 18.49L7.7099 20.32C7.77948 20.527 7.91489 20.7055 8.09546 20.8283C8.27603 20.9511 8.49183 21.0114 8.7099 21H12.7099C12.9195 21.0006 13.1241 20.9352 13.2945 20.8132C13.465 20.6912 13.5928 20.5186 13.6599 20.32L14.2699 18.49C14.3479 18.2585 14.5079 18.0636 14.7198 17.942C14.9316 17.8204 15.1807 17.7806 15.4199 17.83L17.2999 18.21C17.5061 18.2529 17.7205 18.2295 17.9126 18.1433C18.1048 18.0571 18.2648 17.9125 18.3699 17.73L20.3699 14.27C20.4761 14.0873 20.5216 13.8757 20.5001 13.6655C20.4785 13.4553 20.3909 13.2573 20.2499 13.1L18.8999 11.66ZM17.4099 13L18.2099 13.9L16.9299 16.12L15.7499 15.88C15.0297 15.7328 14.2805 15.8551 13.6445 16.2238C13.0085 16.5925 12.53 17.1819 12.2999 17.88L11.9199 19H9.3599L8.9999 17.86C8.76975 17.1619 8.29128 16.5725 7.6553 16.2038C7.01932 15.8351 6.27012 15.7128 5.5499 15.86L4.3699 16.1L3.0699 13.89L3.8699 12.99C4.36185 12.44 4.63383 11.7279 4.63383 10.99C4.63383 10.2521 4.36185 9.54004 3.8699 8.99002L3.0699 8.09002L4.3499 5.89002L5.5299 6.13002C6.25012 6.27724 6.99932 6.1549 7.6353 5.78622C8.27128 5.41753 8.74975 4.82818 8.9799 4.13002L9.3599 3.00002H11.9199L12.2999 4.14002C12.53 4.83818 13.0085 5.42753 13.6445 5.79622C14.2805 6.1649 15.0297 6.28724 15.7499 6.14002L16.9299 5.90002L18.2099 8.12002L17.4099 9.02002C16.9235 9.56878 16.6549 10.2767 16.6549 11.01C16.6549 11.7433 16.9235 12.4513 17.4099 13ZM10.6399 7.00002C9.84877 7.00002 9.07541 7.23461 8.41761 7.67414C7.75982 8.11366 7.24713 8.73838 6.94438 9.46928C6.64163 10.2002 6.56241 11.0045 6.71675 11.7804C6.8711 12.5563 7.25206 13.269 7.81147 13.8284C8.37088 14.3879 9.08361 14.7688 9.85954 14.9232C10.6355 15.0775 11.4397 14.9983 12.1706 14.6955C12.9015 14.3928 13.5262 13.8801 13.9658 13.2223C14.4053 12.5645 14.6399 11.7911 14.6399 11C14.6399 9.93915 14.2185 8.92174 13.4683 8.17159C12.7182 7.42144 11.7008 7.00002 10.6399 7.00002ZM10.6399 13C10.2443 13 9.85765 12.8827 9.52876 12.663C9.19986 12.4432 8.94351 12.1308 8.79214 11.7654C8.64076 11.3999 8.60116 10.9978 8.67833 10.6098C8.7555 10.2219 8.94598 9.86551 9.22568 9.5858C9.50539 9.3061 9.86175 9.11562 10.2497 9.03845C10.6377 8.96128 11.0398 9.00088 11.4053 9.15226C11.7707 9.30363 12.0831 9.55998 12.3028 9.88888C12.5226 10.2178 12.6399 10.6045 12.6399 11C12.6399 11.5304 12.4292 12.0392 12.0541 12.4142C11.679 12.7893 11.1703 13 10.6399 13Z"
                      fill="white"
                    />
                  </svg>
                }
              >
                <DropdownItem>
                  <RoleButton
                    id="update-facility"
                    className="flex gap-3 items-center"
                    handleClickCB={() =>
                      navigate(`/facility/${facilityId}/update`)
                    }
                    disableFor="readOnly"
                    buttonType="html"
                  >
                    <i className="fas fa-pencil-alt text-primary-500"></i>
                    Update Facility
                  </RoleButton>
                </DropdownItem>
                <DropdownItem>
                  <button
                    className="flex gap-3 items-center"
                    onClick={() =>
                      navigate(`/facility/${facilityId}/inventory`)
                    }
                  >
                    <i className="fas fa-dolly-flatbed text-primary-500"></i>
                    Inventory Management
                  </button>
                </DropdownItem>
                <DropdownItem>
                  <RoleButton
                    className="flex gap-3 items-center"
                    handleClickCB={() =>
                      navigate(`/facility/${facilityId}/location`)
                    }
                    disableFor="readOnly"
                    buttonType="html"
                  >
                    <i className="fas fa-map-marker-alt text-primary-500"></i>
                    Location Management
                  </RoleButton>
                </DropdownItem>
                <DropdownItem>
                  <RoleButton
                    className="flex gap-3 items-center"
                    handleClickCB={() =>
                      navigate(`/facility/${facilityId}/resource/new`)
                    }
                    disableFor="readOnly"
                    buttonType="html"
                  >
                    <i className="fas fa-dolly-flatbed text-primary-500"></i>
                    Resource Request
                  </RoleButton>
                </DropdownItem>
                <DropdownItem>
                  <RoleButton
                    className="flex gap-3 items-center"
                    handleClickCB={() =>
                      navigate(`/facility/${facilityId}/assets/new`)
                    }
                    disableFor="readOnly"
                    buttonType="html"
                  >
                    <i className="fas fa-plus-circle text-primary-500"></i>
                    Create Asset
                  </RoleButton>
                </DropdownItem>
                <DropdownItem>
                  <button
                    className="flex gap-3 items-center"
                    onClick={() => navigate(`/assets?facility=${facilityId}`)}
                  >
                    <i className="fas fa-boxes text-primary-500"></i>
                    View Assets
                  </button>
                </DropdownItem>
                <DropdownItem>
                  <button
                    className="flex gap-3 items-center"
                    onClick={() => navigate(`/facility/${facilityId}/users`)}
                  >
                    <i className="fas fa-users text-primary-500"></i>
                    View Users
                  </button>
                </DropdownItem>
                {currentUser.data.user_type === "DistrictAdmin" ||
                currentUser.data.user_type === "StateAdmin" ? (
                  <DropdownItem activeColor="#C81E1E">
                    <button
                      id="facility-delete"
                      className="text-[#C81E1E] flex gap-3 items-center"
                      onClick={() => setOpenDeleteDialog(true)}
                    >
                      <i className="fas fa-trash text-[#C81E1E]"></i>
                      Delete Facility
                    </button>
                  </DropdownItem>
                ) : (
                  <></>
                )}
              </DropdownMenu>
            </div>
            <div className="flex flex-col justify-end">
              <RoleButton
                className="btn-primary btn mt-2 w-full md:w-auto"
                handleClickCB={() =>
                  navigate(`/facility/${facilityId}/patient`)
                }
                data-testid="add-patient-button"
                disableFor="readOnly"
                buttonType="html"
              >
                <i className="fas fa-plus text-white mr-2"></i>
                Add Details of a Patient
              </RoleButton>

              <button
                className="btn-primary btn mt-2 w-full md:w-auto"
                onClick={() => navigate(`/facility/${facilityId}/patients`)}
              >
                <i className="fas fa-user-injured text-white mr-2"></i>
                View Patients
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded p-3 md:p-6 shadow mt-5">
        <h1 className="text-xl font-bold mb-6">Oxygen Information</h1>

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
      <div className="bg-white rounded p-3 md:p-6 shadow mt-5">
        <div className="mt-6">
          <div className="md:flex justify-between  md:border-b md:pb-2">
            <div className="font-semibold text-xl">Bed Capacity</div>
            <RoleButton
              className="btn-primary btn w-full md:w-auto"
              handleClickCB={() => navigate(`/facility/${facilityId}/bed`)}
              disableFor="readOnly"
              buttonType="html"
            >
              <i className="fas fa-bed text-white mr-2"></i>
              Add More Bed Types
            </RoleButton>
          </div>
          <div className="mt-4 flex flex-wrap w-full">{capacityList}</div>
        </div>
      </div>
      <div className="bg-white rounded p-3 md:p-6 shadow mt-5">
        <div className="mt-4">
          <div className="md:flex justify-between  md:border-b md:pb-2">
            <div className="font-semibold text-xl">Doctors List</div>
            <RoleButton
              className="btn-primary btn w-full md:w-auto"
              handleClickCB={() => navigate(`/facility/${facilityId}/doctor`)}
              disabled={doctorList.length === DOCTOR_SPECIALIZATION.length}
              disableFor="readOnly"
              buttonType="html"
            >
              <i className="fas fa-user-md text-white mr-2"></i>
              Add Doctor Types
            </RoleButton>
          </div>
          <div className="mt-4 flex flex-wrap">{doctorList}</div>
        </div>
      </div>
      <div className="bg-white rounded p-3 md:p-6 shadow mt-5">
        <div className="-my-2 py-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="md:flex justify-between md:pb-2">
            <div className="text-xl font-bold">Corona Triage</div>
            <RoleButton
              className="btn-primary btn w-full md:w-auto"
              handleClickCB={() => navigate(`/facility/${facilityId}/triage`)}
              disableFor="readOnly"
              buttonType="html"
            >
              <i className="fas fa-notes-medical text-white mr-2"></i>
              Add Triage
            </RoleButton>
          </div>
          <div className="overflow-x-auto min-w-full overflow-hidden mt-4">
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
                <div className="p-4 text-xl text-gray-500 font-bold flex justify-center items-center">
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
