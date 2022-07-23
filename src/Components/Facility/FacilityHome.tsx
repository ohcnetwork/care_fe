import { Link, navigate } from "raviger";
import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import loadable from "@loadable/component";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import { BED_TYPES, DOCTOR_SPECIALIZATION, FACILITY_FEATURE_TYPES } from "../../Common/constants";
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
  const [facilityNotFound, setFacilityNotFound] = useState(false);
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
        setFacilityNotFound(true);
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
    if (res && res.status === 204) {
      Notification.Success({
        msg: "Facility deleted successfully",
      });
    } else {
      Notification.Error({
        msg:
          "Error while deleting Facility: " +
          ((res.data && res.data.detail) || ""),
      });
    }
    navigate("/facility");
  };

  const state: any = useSelector((state) => state);
  const { currentUser } = state;

  if (isLoading) {
    return <Loading />;
  }

  if (facilityNotFound) {
    return (
      <div className="flex justify-center text-center items-center h-screen">
        <div className="text-center error-page-wrap">
          <div>
            <div className="w-28  -rotate-45 mx-auto relative top-14">
              <div className="bg-gray-900 h-1 w-full"></div>
              <div className="bg-gray-100 h-1 w-full"></div>
            </div>
            <i className="fas fa-hospital text-6xl my-4"></i>
          </div>

          <h1>Facility Not Found</h1>
          <p>
            A facility with ID: {facilityId}, does not exist!
            <br />
            <br />
            <Link
              href="/"
              className="rounded-lg px-4 py-2 inline-block bg-primary-600 text-white hover:text-white hover:bg-primary-700"
            >
              Return to CARE
            </Link>
          </p>
        </div>
      </div>
    );
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
        return (
          <BedTypeCard facilityId={facilityId} key={`bed_${res.id}`} {...res} />
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
        <DialogTitle className="flex justify-center bg-primary-100">
          Are you sure you want to delete {facilityData.name || "Facility"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            You will not be able to access this facility after it is deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <button onClick={handleDeleteClose} className="btn btn-primary">
            Cancel
          </button>
          <button
            onClick={handleDeleteSubmit}
            id="facility-delete-confirm"
            className="btn btn-danger"
          >
            Delete
          </button>
        </DialogActions>
      </Dialog>
      <div className="bg-white rounded-lg p-3 md:p-6 shadow">
        <div className="md:flex justify-between gap-2">
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
                      <p className="text-lg">
                        {facilityData?.local_body_object?.name}
                      </p>
                    </div>
                    <div className="flex gap-4">
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
                <h1 className="text-lg font-bold">Features</h1>
                <div className="flex gap-2 flex-wrap mt-2">
                  {facilityData.features?.map((feature, i)=>(
                    <div key={i} className="bg-primary-100 text-primary-600 font-semibold px-3 py-1 rounded-full border border-primary-600 text-sm">
                      <i className={`fas fa-${FACILITY_FEATURE_TYPES.filter(f=>f.id === feature)[0].icon}`}/> &nbsp;{FACILITY_FEATURE_TYPES.filter(f=>f.id === feature)[0].name}
                    </div>
                  ))}
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
          <div className="flex flex-col mt-2 md:mt-4">
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
              className="btn-primary btn mt-2"
              onClick={() => navigate(`/facility/${facilityId}/inventory`)}
            >
              <i className="fas fa-dolly-flatbed text-white mr-2"></i>
              Inventory Management
            </button>
            <RoleButton
              className="btn-primary btn mt-2"
              handleClickCB={() => navigate(`/facility/${facilityId}/location`)}
              disableFor="readOnly"
              buttonType="html"
            >
              <i className="fas fa-map-marker-alt text-white mr-2"></i>
              Location Management
            </RoleButton>
            <RoleButton
              className="btn-primary btn mt-2"
              handleClickCB={() =>
                navigate(`/facility/${facilityId}/resource/new`)
              }
              disableFor="readOnly"
              buttonType="html"
            >
              <i className="fas fa-dolly-flatbed text-white mr-2"></i>
              Resource Request
            </RoleButton>
            <RoleButton
              className="btn-primary btn mt-2"
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
              className="btn-primary btn mt-2"
              onClick={() => navigate(`/assets?facility=${facilityId}`)}
            >
              <i className="fas fa-boxes text-white mr-2"></i>
              View Assets
            </button>
            <button
              className="btn-primary btn mt-2"
              onClick={() => navigate(`/facility/${facilityId}/users`)}
            >
              <i className="fas fa-users text-white mr-2"></i>
              View Users
            </button>
            {(currentUser.data.user_type === "DistrictAdmin" ||
              currentUser.data.user_type === "StateAdmin") && (
              <button
                id="facility-delete"
                className="btn-danger btn mt-2"
                onClick={() => setOpenDeleteDialog(true)}
              >
                <i className="fas fa-trash text-white mr-2"></i>
                Delete Facility
              </button>
            )}
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
