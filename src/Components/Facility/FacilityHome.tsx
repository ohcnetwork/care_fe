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
import { RoleButton } from "../Common/RoleButton";
import CoverImageEditModal from "./CoverImageEditModal";
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
  const [editCoverImage, setEditCoverImage] = React.useState(false);
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

  const stats = patientStatsData.map((data: PatientStatsModel, index) => {
    return (
      <tr className="border" key={index}>
        <td className="border px-4 py-2 whitespace-nowrap">
          {data.entry_date || "0"}
        </td>
        <td className="border px-4 py-2 text-center">
          {data.num_patients_visited || "0"}
        </td>
        <td className="border px-4 py-2 text-center">
          {data.num_patients_home_quarantine || "0"}
        </td>
        <td className="border px-4 py-2 text-center">
          {data.num_patients_isolation || "0"}
        </td>
        <td className="border px-4 py-2 text-center">
          {data.num_patient_referred || "0"}
        </td>
        <td className="border px-4 py-2 text-center">
          {data.num_patient_confirmed_positive || "0"}
        </td>
        <td className="border px-4 py-2">
          <RoleButton
            className="btn btn-default"
            handleClickCB={() =>
              navigate(`/facility/${facilityId}/triage/${data.id}`)
            }
            disableFor="readOnly"
            buttonType="html"
          >
            Edit
          </RoleButton>
        </td>
      </tr>
    );
  });

  const hasCoverImage = !!facilityData.read_cover_image_url;

  const StaffUserTypeIndex = USER_TYPES.findIndex((type) => type === "Staff");
  const hasPermissionToEditCoverImage =
    !(currentUser.data.user_type as string).includes("ReadOnly") &&
    USER_TYPES.findIndex((type) => type == currentUser.data.user_type) >=
      StaffUserTypeIndex;

  const editCoverImageTooltip = hasPermissionToEditCoverImage && (
    <div className="transition-all bg-black bg-opacity-60 h-8 left-0 right-0 -bottom-8 group-hover:bottom-0 absolute flex justify-start items-center z-10 gap-3 px-4 text-gray-300">
      <i className="fa-solid fa-pen"></i>
      <span>{`${hasCoverImage ? "Edit" : "Upload a "} cover image`}</span>
    </div>
  );

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
      <CoverImageEditModal
        open={editCoverImage}
        onClose={() => setEditCoverImage(false)}
        facility={facilityData}
      />
      {hasCoverImage && (
        <div
          className={`group relative overflow-clip w-full rounded-t-lg bg-gray-200 h-48 lg:h-0 opacity-100 lg:opacity-0 transition-all duration-200 ease-in-out ${
            hasPermissionToEditCoverImage && "cursor-pointer"
          }`}
          onClick={() =>
            hasPermissionToEditCoverImage && setEditCoverImage(true)
          }
        >
          <img
            src={facilityData.read_cover_image_url}
            alt="Facility"
            className="w-full object-cover h-full"
          />
          {editCoverImageTooltip}
        </div>
      )}
      <div
        className={`bg-white ${
          hasCoverImage ? "rounded-b-lg lg:rounded-t-lg" : "rounded-lg"
        } p-3 md:p-6 shadow transition-all duration-200 ease-in-out`}
      >
        <div className="lg:flex justify-between gap-2">
          <div className="md:flex flex-col justify-between">
            <div className="flex flex-col flex-1 gap-3">
              <div>
                <h1 className="text-4xl font-bold">{facilityData.name}</h1>
                <p className="text-xl text-gray-700">
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
            <div className="mt-2">
              <RoleButton
                className="btn-primary btn mt-2 mr-2 w-full md:w-auto"
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
                className="btn-primary btn mt-2 mr-2 w-full md:w-auto"
                onClick={() => navigate(`/facility/${facilityId}/patients`)}
              >
                <i className="fas fa-user-injured text-white mr-2"></i>
                View Patients
              </button>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <div
              className={`group relative h-0 lg:h-48 w-full opacity-0 lg:opacity-100 transition-all duration-200 ease-in-out rounded-lg overflow-clip ${
                hasPermissionToEditCoverImage && "cursor-pointer"
              }`}
              onClick={() =>
                hasPermissionToEditCoverImage && setEditCoverImage(true)
              }
            >
              {hasCoverImage ? (
                <img
                  src={facilityData.read_cover_image_url}
                  alt="Facility"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="lg:h-48 bg-gray-200 text-gray-700 flex items-center justify-center font-medium">
                  No cover image
                </div>
              )}
              {editCoverImageTooltip}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 mt-2 md:mt-4 transition-all duration-200 ease-in-out">
              <RoleButton
                id="update-facility"
                className="btn-primary btn"
                handleClickCB={() => navigate(`/facility/${facilityId}/update`)}
                disableFor="readOnly"
                buttonType="html"
              >
                <i className="fas fa-pencil-alt text-white mr-2"></i>
                Update Facility
              </RoleButton>
              <button
                className="btn-primary btn"
                onClick={() => navigate(`/facility/${facilityId}/inventory`)}
              >
                <i className="fas fa-dolly-flatbed text-white mr-2"></i>
                Manage Inventory
              </button>
              <RoleButton
                className="btn-primary btn"
                handleClickCB={() =>
                  navigate(`/facility/${facilityId}/location`)
                }
                disableFor="readOnly"
                buttonType="html"
              >
                <i className="fas fa-map-marker-alt text-white mr-2"></i>
                Manage Locations
              </RoleButton>
              <RoleButton
                className="btn-primary btn"
                handleClickCB={() =>
                  navigate(`/facility/${facilityId}/resource/new`)
                }
                disableFor="readOnly"
                buttonType="html"
              >
                <i className="fas fa-dolly-flatbed text-white mr-2"></i>
                Request Resource
              </RoleButton>
              <RoleButton
                className="btn-primary btn"
                handleClickCB={() =>
                  navigate(`/facility/${facilityId}/assets/new`)
                }
                disableFor="readOnly"
                buttonType="html"
              >
                <i className="fas fa-plus-circle text-white mr-2"></i>
                Create Asset
              </RoleButton>
              <button
                className="btn-primary btn"
                onClick={() => navigate(`/assets?facility=${facilityId}`)}
              >
                <i className="fas fa-boxes text-white mr-2"></i>
                View Assets
              </button>
              <button
                className="btn-primary btn"
                onClick={() => navigate(`/facility/${facilityId}/users`)}
              >
                <i className="fas fa-users text-white mr-2"></i>
                View Users
              </button>
              {(currentUser.data.user_type === "DistrictAdmin" ||
                currentUser.data.user_type === "StateAdmin") && (
                <button
                  id="facility-delete"
                  className="btn-danger btn"
                  onClick={() => setOpenDeleteDialog(true)}
                >
                  <i className="fas fa-trash text-white mr-2"></i>
                  Delete Facility
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6">
          <h1 className="text-xl font-semibold mb-6 pb-4 md:border-b">
            Information on Oxygen
          </h1>

          <div className="overflow-x-auto sm:rounded-lg mt-4">
            <table className="border-2 rounded overflow-hidden align-middle">
              <thead>
                <tr className="white border">
                  <th className="border px-4 py-2"></th>
                  <th className="border px-4 py-2 whitespace-nowrap">
                    Oxygen capacity
                  </th>
                  <th className="border px-4 py-2 whitespace-nowrap">
                    Type B cylinder
                  </th>
                  <th className="border px-4 py-2 whitespace-nowrap">
                    Type C cylinder
                  </th>
                  <th className="border px-4 py-2 whitespace-nowrap">
                    Type D cylinder
                  </th>
                </tr>
                <tr className="border">
                  <th className="border px-4 py-2">Capacity</th>
                  <td className="border px-4 py-2 text-center">
                    {facilityData.oxygen_capacity}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {facilityData.type_b_cylinders}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {facilityData.type_c_cylinders}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {facilityData.type_d_cylinders}
                  </td>
                </tr>
                <tr className="border">
                  <th className="border px-4 py-2">
                    Daily Expected Consumption
                  </th>
                  <td className="border px-4 py-2 text-center">
                    {facilityData.expected_oxygen_requirement}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {facilityData.expected_type_b_cylinders}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {facilityData.expected_type_c_cylinders}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {facilityData.expected_type_d_cylinders}
                  </td>
                </tr>
              </thead>
            </table>
          </div>
        </div>
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
        <div className="-my-2 py-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mt-4">
          <div className="md:flex justify-between  md:border-b md:pb-2">
            <div className="font-semibold text-xl">Corona Triage</div>
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
          <div className="overflow-x-auto  min-w-full shadow overflow-hidden sm:rounded-lg border-b border-gray-200 mt-4">
            <table className="min-w-full border-2 rounded overflow-hidden align-middle">
              <thead>
                <tr className="white border">
                  <th className="border px-4 py-2">Date</th>
                  <th className="border px-4 py-2">Total Triaged</th>
                  <th className="border px-4 py-2">Advised Home Quarantine</th>
                  <th className="border px-4 py-2">Suspects Isolated</th>
                  <th className="border px-4 py-2">Referred</th>
                  <th className="border px-4 py-2">Confirmed positives</th>
                  <th className="border px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>{stats}</tbody>
            </table>
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
