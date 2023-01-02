import React, { Dispatch, SetStateAction, useCallback } from "react";
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
import CircularProgress from "@material-ui/core/CircularProgress";
import { TextInputField } from "../../Common/HelperInputFields";
import { formatDate } from "../../../Utils/utils";

const formatDateTime: () => string = () => {
  const current = new Date();
  const yyyy = String(current.getFullYear()).padStart(4, "0");
  const mm = String(current.getMonth() + 1).padStart(2, "0");
  const dd = String(current.getDate()).padStart(2, "0");
  const hh = String(current.getHours()).padStart(2, "0");
  const min = String(current.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

interface BedsProps {
  facilityId: string;
  patientId: number;
  consultationId: number;
  smallLoader?: boolean;
  discharged?: boolean;
  setState?: Dispatch<SetStateAction<boolean>>;
  fetchPatientData?: (state: { aborted: boolean }) => void;
}

const Beds = (props: BedsProps) => {
  const dispatch = useDispatch<any>();
  const { facilityId, consultationId, discharged } = props;
  const [bed, setBed] = React.useState<BedModel>({});
  const [startDate, setStartDate] = React.useState<string>(formatDateTime());
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
      if (props.fetchPatientData) props.fetchPatientData({ aborted: false });
      if (props.setState) props.setState(false);
    }
  };

  if (isLoading) {
    if (props.smallLoader && props.smallLoader === true) {
      return (
        <div className="p-5 pl-10 pr-10 w-full flex justify-center items-center">
          <CircularProgress />
        </div>
      );
    }
    return <Loading />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="font-bold text-secondary-500">
          {!discharged ? "Move to bed:" : "Bed History"}
        </div>
        {props.setState && (
          <button
            className="text-xl"
            onClick={() => props.setState && props.setState(false)}
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>
      {!discharged ? (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
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
          <div className="flex flex-row justify-center mt-4">
            <div>
              <Button
                color="primary"
                variant="contained"
                type="submit"
                style={{ marginLeft: "auto" }}
                startIcon={<i className="fas fa-bed" />}
              >
                Move to bed
              </Button>
            </div>
          </div>
        </form>
      ) : (
        ""
      )}
      <div>
        <h3 className="my-4 text-lg">Previous beds: </h3>
        <div className="overflow-hidden rounded-xl">
          <div className="grid grid-cols-4 gap-[1px]">
            <div className="font-bold text-center bg-primary-500 text-white py-2">
              Bed
            </div>
            <div className="font-bold text-center bg-primary-500 text-white py-2">
              Location
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
              <div className="grid grid-cols-4 gap-[1px]" key={bed?.id}>
                <div className="text-center bg-primary-100 p-2 break-words">
                  {bed?.bed_object?.name}
                </div>
                <div className="text-center bg-primary-100 py-2">
                  {bed?.bed_object?.location_object?.name}
                </div>
                <div className="text-center bg-primary-100 p-2 break-words">
                  {formatDate(bed?.start_date)}
                </div>
                {bed?.end_date ? (
                  <div className="text-center bg-primary-100 p-2 break-words">
                    {formatDate(bed?.end_date)}
                  </div>
                ) : (
                  <div className="text-center bg-primary-100 p-2">
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
