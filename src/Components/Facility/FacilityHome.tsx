import { navigate } from "raviger";
import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import loadable from "@loadable/component";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import { BED_TYPES, DOCTOR_SPECIALIZATION } from "../../Common/constants";
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
      const [facilityRes, capacityRes, doctorRes, triageRes] =
        await Promise.all([
          dispatch(getPermittedFacility(facilityId)),
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
    if (res && Number(res.status) === 204) {
      Notification.Success({
        msg: "Facility deleted successfully",
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
    capacityList = <h5>No Bed Types Found</h5>;
  } else {
    capacityList = BED_TYPES.map((x) => {
      let res = capacityData.find((data) => {
        return data.room_type === x.id;
      });

      return res ? (
        <BedTypeCard facilityId={facilityId} key={`bed_${res.id}`} {...res} />
      ) : null;
    });
  }

  let doctorList: any = null;
  if (!doctorData || !doctorData.length) {
    doctorList = <h5>No Doctors Found</h5>;
  } else {
    doctorList = doctorData.map((data: DoctorModal) => {
      return (
        <DoctorsCountCard
          facilityId={facilityId}
          key={`bed_${data.id}`}
          {...data}
        />
      );
    });
  }

  let stats = patientStatsData.map((data: PatientStatsModel, index) => {
    return (
      <tr className="border" key={index}>
        <td className="border px-4 py-2 whitespace-no-wrap">
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
          <button
            className="btn btn-default"
            onClick={() =>
              navigate(`/facility/${facilityId}/triage/${data.id}`)
            }
          >
            Edit
          </button>
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
                  {
                    // @ts-ignore
                    facilityData?.modified_date &&
                      // @ts-ignore
                      moment(facilityData?.modified_date).fromNow()
                  }
                </p>
              </div>
              <div className="flex items-center flex-1">
                <div className="grid grid-cols-1  lg:grid-cols-2 gap-4 mb-6 md:mb-0 w-full">
                  <div className="md:flex flex-col justify-between lg:flex-1 min-w-[300px]">
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
                  <div className="lg:flex-1 min-w-[300px] md:flex flex-col justify-between">
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
            <div className="mt-2">
              <button
                className="btn-primary btn mt-2 mr-2 w-full md:w-auto"
                onClick={() => navigate(`/facility/${facilityId}/patient`)}
                data-testid="add-patient-button"
              >
                <i className="fas fa-plus text-white mr-2"></i>
                Add Details of a Patient
              </button>

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
            <button
              id="update-facility"
              className="btn-primary btn"
              onClick={() => navigate(`/facility/${facilityId}/update`)}
            >
              <i className="fas fa-pencil-alt text-white mr-2"></i>
              Update Facility
            </button>
            <button
              className="btn-primary btn mt-2"
              onClick={() => navigate(`/facility/${facilityId}/inventory`)}
            >
              <i className="fas fa-dolly-flatbed text-white mr-2"></i>
              Inventory Management
            </button>
            <button
              className="btn-primary btn mt-2"
              onClick={() => navigate(`/facility/${facilityId}/location`)}
            >
              <i className="fas fa-map-marker-alt text-white mr-2"></i>
              Location Management
            </button>
            <button
              className="btn-primary btn mt-2"
              onClick={() => navigate(`/facility/${facilityId}/resource/new`)}
            >
              <i className="fas fa-dolly-flatbed text-white mr-2"></i>
              Resource Request
            </button>
            <button
              className="btn-primary btn mt-2"
              onClick={() => navigate(`/facility/${facilityId}/assets/new`)}
            >
              <i className="fas fa-plus-circle text-white mr-2"></i>
              Create Asset
            </button>
            <button
              className="btn-primary btn mt-2"
              onClick={() => navigate(`/assets?facility=${facilityId}`)}
            >
              <i className="fas fa-boxes text-white mr-2"></i>
              View Assets
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

          <div className="grid grid-cols-5 mb-6 max-w-2xl p-0 bg-white break-all">
            <div className="border p-2"></div>
            <div className="border p-2 text-right font-semibold">Liquid</div>
            <div className="border p-2 text-right font-semibold">B</div>
            <div className="border p-2 text-right font-semibold">C</div>
            <div className="border p-2 text-right font-semibold">D</div>
            <div className="border p-2 font-semibold">Capacity</div>
            <div className="border p-2 text-right ">
              {facilityData.oxygen_capacity}
            </div>
            <div className="border p-2 text-right ">
              {facilityData.type_b_cylinders}
            </div>
            <div className="border p-2 text-right ">
              {facilityData.type_c_cylinders}
            </div>
            <div className="border p-2 text-right ">
              {facilityData.type_d_cylinders}
            </div>
            <div className="border p-2 font-semibold">
              Daily Expected Consumption
            </div>
            <div className="border p-2 text-right">
              {facilityData.expected_oxygen_requirement}
            </div>
            <div className="border p-2 text-right">
              {facilityData.expected_type_b_cylinders}
            </div>
            <div className="border p-2 text-right">
              {facilityData.expected_type_c_cylinders}
            </div>
            <div className="border p-2 text-right">
              {facilityData.expected_type_d_cylinders}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="md:flex justify-between  md:border-b md:pb-2">
            <div className="font-semibold text-xl">Bed Capacity</div>
            <button
              className="btn-primary btn w-full md:w-auto"
              onClick={() => navigate(`/facility/${facilityId}/bed`)}
            >
              <i className="fas fa-bed text-white mr-2"></i>
              Add More Bed Types
            </button>
          </div>
          <div className="mt-4 flex flex-wrap">{capacityList}</div>
        </div>
        <div className="mt-4">
          <div className="md:flex justify-between  md:border-b md:pb-2">
            <div className="font-semibold text-xl">Doctors List</div>
            <button
              className="btn-primary btn w-full md:w-auto"
              onClick={() => navigate(`/facility/${facilityId}/doctor`)}
              disabled={doctorList.length === DOCTOR_SPECIALIZATION.length}
            >
              <i className="fas fa-user-md text-white mr-2"></i>
              Add Doctor Types
            </button>
          </div>
          <div className="mt-4 flex flex-wrap">{doctorList}</div>
        </div>
        <div className="-my-2 py-2 overflow-x-auto sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mt-4">
          <div className="md:flex justify-between  md:border-b md:pb-2">
            <div className="font-semibold text-xl">Corona Triage</div>
            <button
              className="btn-primary btn w-full md:w-auto"
              onClick={() => navigate(`/facility/${facilityId}/triage`)}
            >
              <i className="fas fa-notes-medical text-white mr-2"></i>
              Add Triage
            </button>
          </div>
          <div className="align-middle inline-block min-w-full shadow overflow-hidden sm:rounded-lg border-b border-gray-200 mt-4">
            <table className="min-w-full border-2 rounded overflow-hidden">
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
          </div>
        </div>
      </div>
    </div>
  );
};
