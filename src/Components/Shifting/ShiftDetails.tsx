import React, { useState, useCallback } from "react";
import { Loading } from "../Common/Loading";
import PageTitle from "../Common/PageTitle";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getShiftDetails, deleteShiftRecord } from "../../Redux/actions";
import { navigate } from "hookrouter";
import Button from "@material-ui/core/Button";
import { GENDER_TYPES } from "../../Common/constants";
import moment from "moment";
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import * as Notification from "../../Utils/Notifications.js";

export default function ShiftDetails(props: any) {
  
  const dispatch: any = useDispatch();
  let initialData: any = {};
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);

  const [openDeleteShiftDialog, setOpenDeleteShiftDialog] = React.useState(false);

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(
        getShiftDetails(props.id)
      );
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

    let res = await dispatch( deleteShiftRecord(props.id) );
    if (res.status >= 200) {
      Notification.Success({ msg: "Shifting record has been deleted successfully." });
    }

    navigate(`/shifting`)
  }

  const showPatientCard = (patientData: any) => {
    const patientGender = GENDER_TYPES.find(i => i.id === patientData.gender)?.text;

    return (
      <div className="border rounded-lg bg-white shadow h-full text-black mt-2 p-4">
        <div className="grid gap-2 grid-cols-1 md:grid-cols-2 mt-2">
          <div>
            <span className="font-semibold leading-relaxed">Name: </span>
            {patientData.name}
          </div>
          {patientData.is_medical_worker && (
            <div>
              <span className="font-semibold leading-relaxed">Medical Worker: </span>
              <span className="badge badge-pill badge-primary">Yes</span>
            </div>)}
            <div>
              <span className="font-semibold leading-relaxed">Disease Status: </span>
              {patientData.disease_status}
            </div>
          <div>
            <span className="font-semibold leading-relaxed">Facility: </span>
            {patientData.facility_object?.name || '-'}
          </div>
          {patientData.date_of_birth ? (<div>
            <span className="font-semibold leading-relaxed">Date of birth: </span>
            {patientData.date_of_birth}
          </div>) : (<div>
            <span className="font-semibold leading-relaxed">Age: </span>
            {patientData.age}
          </div>)}
          <div>
            <span className="font-semibold leading-relaxed">Gender: </span>
            {patientGender}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Phone: </span>
            <a href={`tel:${patientData.phone_number}`}>{patientData.phone_number || "-"}</a>
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Nationality: </span>
            {patientData.nationality || '-'}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Blood Group: </span>
            {patientData.blood_group || '-'}
          </div>
          {patientData.nationality !== 'India' && <div>
            <span className="font-semibold leading-relaxed">Passport Number: </span>
            {patientData.passport_no || '-'}
          </div>}
          {patientData.nationality === 'India' && (<>
            <div>
              <span className="font-semibold leading-relaxed">State: </span>
              {patientData.state_object?.name}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">District: </span>
              {patientData.district_object?.name || '-'}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">Local Body: </span>
              {patientData.local_body_object?.name || '-'}
            </div>
          </>)}
          <div>
            <span className="font-semibold leading-relaxed">Address: </span>
            {patientData.address || '-'}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Contact with confirmed carrier: </span>
            {patientData.contact_with_confirmed_carrier ? <span className="badge badge-pill badge-warning">Yes</span> : <span className="badge badge-pill badge-secondary">No</span>}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Contact with suspected carrier: </span>
            {patientData.contact_with_suspected_carrier ? <span className="badge badge-pill badge-warning">Yes</span> : <span className="badge badge-pill badge-secondary">No</span>}
          </div>
          {patientData.estimated_contact_date && (<div>
            <span className="font-semibold leading-relaxed">Estimated contact date: </span>
            {moment(patientData.estimated_contact_date).format("LL")}
          </div>)}
          <div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">Has SARI (Severe Acute Respiratory illness)?: </span>
            {patientData.has_SARI ? <span className="badge badge-pill badge-warning">Yes</span> : <span className="badge badge-pill badge-secondary">No</span>}
          </div>
          <div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">Domestic/international Travel (within last 28 days): </span>
            {patientData.past_travel ? <span className="badge badge-pill badge-warning">Yes</span> : <span className="badge badge-pill badge-secondary">No</span>}
          </div>
          {patientData.countries_travelled && !!patientData.countries_travelled.length && (<div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">Countries travelled: </span>
            {Array.isArray(patientData.countries_travelled) ? patientData.countries_travelled.join(", ") : patientData.countries_travelled.split(',').join(', ')}
          </div>)}
          {patientData.ongoing_medication && (<div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">Ongoing Medications </span>
            {patientData.ongoing_medication}
          </div>)}
          {
            patientData.allergies &&
            <div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">Allergies:  </span>
            { patientData.allergies }
          </div>
          }
          {!!patientData.number_of_aged_dependents && (<div>
            <span className="font-semibold leading-relaxed">Number Of Aged Dependents (Above 60): </span>
            {patientData.number_of_aged_dependents}
          </div>)}
          {!!patientData.number_of_chronic_diseased_dependents && (<div>
            <span className="font-semibold leading-relaxed">Number Of Chronic Diseased Dependents: </span>
            {patientData.number_of_chronic_diseased_dependents}
          </div>)}
        </div>
      </div>
    )
  }

  const showFacilityCard = (facilityData: any) => {
    return (
      <div className="border rounded-lg bg-white shadow h-full text-black mt-2 p-4">
        <div>
          <span className="font-semibold leading-relaxed mr-1">Name: </span>
            {facilityData?.name || "--"}
        </div>
        <div>
          <span className="font-semibold leading-relaxed mr-1">Facility type: </span>
            {facilityData?.facility_type?.name || "--"}
        </div>
        <div>
          <span className="font-semibold leading-relaxed mr-1">District: </span>
            {facilityData?.district_object?.name || "--"}
        </div>
        <div>
          <span className="font-semibold leading-relaxed mr-1">Local body: </span>
            {facilityData?.local_body_object?.name || "--"}
        </div>
        <div>
          <span className="font-semibold leading-relaxed mr-1">State: </span>
            {facilityData?.state_object?.name || "--"}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="mx-3 md:mx-8 mb-10">
      <PageTitle title={"Shifting details"} />

      <div className="border rounded-lg bg-white shadow h-full text-black mt-4 p-4">
        <div className="flex justify-between">
          <div className="grid gap-2 grid-cols-1">
            <div className="flex items-baseline">
              <div>
                <span className="font-semibold leading-relaxed">Parient name: </span>
                {data.patient_object?.name}
              </div>
            </div>
          </div>

          <div>
            <div className="mt-2">
              <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => navigate(`/shifting/${data.external_id}/update`)}>
                Update Status/Details
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
          <div>
              <span className="font-semibold leading-relaxed">Status: </span>
                <span className="badge badge-pill badge-primary py-1 px-2">{data.status}</span>
            </div>
            <div>
              <span className="font-semibold leading-relaxed">Orgin facility: </span>
               {data.orgin_facility_object?.name || "--"}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">Shifting approving facility: </span>
              {data.shifting_approving_facility_object?.name || "--"}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Assigned facility: </span>
            {data.assigned_facility_object?.name || "--"}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Is emergency: </span>
            {data.emergency? "yes" : "no"}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Is up shift: </span>
            {data.is_up_shift? "yes" : "no"}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Vehicle preference: </span>
            {data.vehicle_preference || "--"}
          </div>

          <div className="md:row-span-2 md:col-span-2">
            <div className="font-semibold leading-relaxed">Reason: </div>
            <div className="ml-2">
              {data.reason || "--"}
            </div>
          </div>

          <div className="md:row-span-2 md:col-span-2">
            <div className="font-semibold leading-relaxed">Comments: </div>
            <div className="ml-2">
              {data.comments || "--"}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <div>
            <Button
                fullWidth
                variant="contained"
                color="secondary"
                size="small"
                onClick={() => setOpenDeleteShiftDialog(true)}>
              Delete Record
            </Button>

            <Dialog
                open={openDeleteShiftDialog}
                onClose={() => setOpenDeleteShiftDialog(false)}>
              <DialogTitle id="alert-dialog-title">Authorize shift delete</DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  Are you sure you want to delete this record?
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenDeleteShiftDialog(false)} color="primary">
                  No
                </Button>
                <Button color="primary"
                        onClick={handleShiftDelete} autoFocus>
                  Yes
                </Button>
              </DialogActions>
            </Dialog>

          </div>
        </div>
      </div>

      <h4 className="mt-8">
        Details of patient
      </h4>
      
      {showPatientCard(data.patient_object)}


      <h4 className="mt-8">
        Details of orgin facility
      </h4>

      {showFacilityCard(data.orgin_facility_object)}


      <h4 className="mt-8">
        Details of assigned facility
      </h4>

      {showFacilityCard(data.assigned_facility_object)}

      <h4 className="mt-8">
        Details of shifting approving facility
      </h4>

      {showFacilityCard(data.shifting_approving_facility_object)}

    </div>
  )
}