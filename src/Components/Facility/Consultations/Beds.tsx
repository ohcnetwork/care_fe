import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import {
  createConsultationBed,
  listConsultationBeds,
} from "../../../Redux/actions";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import * as Notification from "../../../Utils/Notifications.js";
import Loading from "../../Common/Loading";
import { BedModel, CurrentBed } from "../models";
import { BedSelect } from "../../Common/BedSelect";
import { Button, InputLabel } from "@material-ui/core";
import { TextInputField } from "../../Common/HelperInputFields";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import moment from "moment";

interface BedsProps {
  facilityId: string;
  patientId: string;
  consultationId: string;
}

const Beds = (props: BedsProps) => {
  const dispatch = useDispatch();
  const { facilityId, consultationId } = props;
  const [bed, setBed] = React.useState<BedModel>({});
  const [startDate, setStartDate] = React.useState<string>("");
  const [consultationBeds, setConsultationBeds] = React.useState<CurrentBed[]>(
    []
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const [bedsData]: any = await Promise.all([
        dispatch(listConsultationBeds({ consultation: consultationId })),
      ]);
      if (!status.aborted) {
        setIsLoading(false);
        if (!bedsData?.data)
          Notification.Error({
            msg: "Something went wrong..!",
          });
        else {
          setConsultationBeds(bedsData?.data?.results);
        }
      }
    },
    [consultationId, dispatch]
  );
  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [dispatch, fetchData]
  );

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!bed?.id)
      return Notification.Error({
        msg: "Please select a bed first..!",
      });
    const res: any = await Promise.resolve(
      dispatch(
        createConsultationBed(
          { start_date: startDate },
          consultationId,
          bed?.id
        )
      )
    );
    if (res && res.status === 201) {
      Notification.Success({
        msg: "Bed allocated successfully",
      });
      window.location.reload();
    } else {
      Notification.Error({
        msg: "Something went wrong..!",
      });
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div>
      <h3 className="mb-4 text-lg">Move to a new bed: </h3>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <InputLabel id="asset-type">Bed</InputLabel>
            <BedSelect
              name="bed"
              setSelected={(selected) => setBed(selected as BedModel)}
              selected={bed}
              errors=""
              multiple={false}
              margin="dense"
              facility={facilityId}
            />
          </div>
          <div>
            <InputLabel htmlFor="date_declared_positive">
              Date of Shift
            </InputLabel>
            <TextInputField
              name="date_declared_positive"
              id="date_declared_positive"
              variant="outlined"
              margin="dense"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              errors=""
            />
          </div>
        </div>
        <div className="flex justify-between mt-4">
          <Button
            color="primary"
            variant="contained"
            type="submit"
            style={{ marginLeft: "auto" }}
            startIcon={<CheckCircleOutlineIcon></CheckCircleOutlineIcon>}
          >
            Move to bed
          </Button>
        </div>
      </form>
      <div>
        <h3 className="my-4 text-lg">Previous beds: </h3>
        <div>
          <div className="grid grid-cols-3 gap-1">
            <div className="font-bold text-center bg-primary-500 text-white py-2">
              Bed
            </div>
            <div className="font-bold text-center bg-primary-500 text-white py-2">
              Start Date
            </div>
            <div className="font-bold text-center bg-primary-500 text-white py-2">
              End Date
            </div>
          </div>
          {consultationBeds.length > 0 ? (
            consultationBeds.map((bed) => (
              <div className="grid grid-cols-3 gap-1" key={bed?.id}>
                <div className="text-center bg-primary-100 py-2">
                  {bed?.bed_object?.name}
                </div>
                <div className="text-center bg-primary-100 py-2">
                  {moment(bed?.start_date).format("MMMM Do YYYY, h:mm:ss a")}
                </div>
                {bed?.end_date ? (
                  <div className="text-center bg-primary-100 py-2">
                    {moment(bed?.end_date).format("MMMM Do YYYY, h:mm:ss a")}
                  </div>
                ) : (
                  <div className="text-center bg-primary-100 py-2">
                    <span className="border px-1 text-sm rounded-full bg-yellow-100 text-yellow-500 border-yellow-500 ">
                      In Use
                    </span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center bg-primary-100 py-2">
              No beds allocated yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Beds;
