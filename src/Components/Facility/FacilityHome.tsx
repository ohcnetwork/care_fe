import { Button, Card, CardContent, Grid, Typography } from "@material-ui/core";
import { navigate } from "raviger";
import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import loadable from "@loadable/component";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogTitle from "@material-ui/core/DialogTitle";
import { BED_TYPES, DOCTOR_SPECIALIZATION } from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  getFacility,
  deleteFacility,
  getTriageInfo,
  listCapacity,
  listDoctor,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));
import BedTypeCard from "./BedTypeCard";
import DoctorsCountCard from "./DoctorsCountCard";
import {
  CapacityModal,
  DoctorModal,
  FacilityModel,
  PatientStatsModel,
} from "./models";

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
          dispatch(getFacility(facilityId)),
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

  const handleDeleteSubmit = () => {
    dispatch(deleteFacility(facilityId));
    navigate("/facility");
  };

  const state: any = useSelector(state => state);
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
      if (res) {
        return (
          <BedTypeCard facilityId={facilityId} key={`bed_${res.id}`} {...res} />
        );
      }
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
      <PageTitle title={facilityData.name || "Facility"} />
      <Dialog
        maxWidth={"md"}
        open={openDeleteDialog}
        onClose={handleDeleteClose}
      >
        <DialogTitle className="flex justify-center bg-green-100">
          Are you sure you want to delete {facilityData.name || "Facility"}
        </DialogTitle>
        <DialogActions>
          <button onClick={handleDeleteClose} className="btn btn-primary">
            Cancel
          </button>
          <button onClick={handleDeleteSubmit} className="btn btn-danger">
            Delete
          </button>
        </DialogActions>
      </Dialog>
      <div className="bg-white rounded-lg md:p-6 p-3 shadow">
        <div className="md:flex justify-between">
          <div>
            <div className="text-xl font-semibold">{facilityData.name}</div>
            <Typography>Address : {facilityData.address}</Typography>
            <Typography>Phone : {facilityData.phone_number}</Typography>
            <Typography>
              District : {facilityData?.district_object?.name}
            </Typography>
            <Typography>
              Local Body : {facilityData?.local_body_object?.name}
            </Typography>

            {facilityData?.ward_object && (
              <Typography>
                Ward :
                {facilityData?.ward_object?.number +
                  ", " +
                  facilityData?.ward_object?.name}
              </Typography>
            )}
            <div className="grid grid-cols-5">
              <div className="border"></div>
              <div className="border font-semibold">Liquid</div>
              <div className="border font-semibold">B</div>
              <div className="border font-semibold">C</div>
              <div className="border font-semibold">D</div>
              <div className="border font-semibold">Capacity</div>
              <div className="border">{facilityData.oxygen_capacity}</div>
              <div className="border">{facilityData.type_b_cylinders}</div>
              <div className="border">{facilityData.type_c_cylinders}</div>
              <div className="border">{facilityData.type_d_cylinders}</div>
              <div className="border font-semibold">Expected</div>
              <div className="border">
                {facilityData.expected_oxygen_requirement}
              </div>
              <div className="border">
                {facilityData.expected_type_b_cylinders}
              </div>
              <div className="border">
                {facilityData.expected_type_c_cylinders}
              </div>
              <div className="border">
                {facilityData.expected_type_d_cylinders}
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <button
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
              onClick={() => navigate(`/facility/${facilityId}/resource/new`)}
            >
              <i className="fas fa-dolly-flatbed text-white mr-2"></i>
              Resource Request
            </button>
            {(currentUser.data.user_type === "DistrictAdmin" || currentUser.data.user_type === "StateAdmin") && <button
              className="btn-danger btn mt-2"
              onClick={() => setOpenDeleteDialog(true)}
            >
              <i className="fas fa-trash text-white mr-2"></i>
              Delete Facility
            </button>}
          </div>
        </div>
        <div>
          <button
            className="btn-primary btn mt-2 mr-2 w-full md:w-auto"
            onClick={() => navigate(`/facility/${facilityId}/patient`)}
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
        <div className="mt-4">
          <div className="md:flex justify-between  md:border-b md:pb-2">
            <div className="font-semibold text-xl">Total Capacity</div>
            <button
              className="btn-primary btn w-full md:w-auto"
              onClick={() => navigate(`/facility/${facilityId}/bed`)}
              disabled={capacityList.length === BED_TYPES.length}
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
