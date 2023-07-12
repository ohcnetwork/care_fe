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
import { formatDate } from "../../../Utils/utils";
import { FieldLabel } from "../../Form/FormFields/FormField";
import ButtonV2 from "../../Common/components/ButtonV2";
import moment from "moment";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import TextFormField from "../../Form/FormFields/TextFormField";
import CircularProgress from "../../Common/components/CircularProgress";

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
  consultationId: string;
  smallLoader?: boolean;
  discharged?: boolean;
  setState?: Dispatch<SetStateAction<boolean>>;
  fetchPatientData?: (state: { aborted: boolean }) => void;
  hideTitle?: boolean;
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
  const [key, setKey] = React.useState(0);

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
    [dispatch, fetchData, key]
  );

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (!bed?.id)
      return Notification.Error({
        msg: "Please select a bed first..!",
      });

    const res: any = await dispatch(
      createConsultationBed({ start_date: startDate }, consultationId, bed?.id)
    );

    if (res && res.status === 201) {
      Notification.Success({
        msg: "Bed allocated successfully",
      });
      if (props.fetchPatientData) props.fetchPatientData({ aborted: false });
      if (props.setState) props.setState(false);
      setKey(key + 1);
    }
  };

  if (isLoading) {
    if (props.smallLoader && props.smallLoader === true) {
      return (
        <div className="flex w-full items-center justify-center p-5 px-10">
          <CircularProgress />
        </div>
      );
    }
    return <Loading />;
  }

  return (
    <div>
      {!props.hideTitle && (
        <div className="mb-4 flex items-center justify-between">
          <div className="font-bold text-secondary-500">
            {!discharged ? "Move to bed" : "Bed History"}
          </div>
          {props.setState && (
            <ButtonV2
              variant="secondary"
              circle
              ghost
              onClick={() => props.setState && props.setState(false)}
            >
              <CareIcon className="care-l-times text-lg" />
            </ButtonV2>
          )}
        </div>
      )}
      {!discharged ? (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            <div>
              <FieldLabel id="asset-type">Bed</FieldLabel>
              <BedSelect
                name="bed"
                setSelected={(selected) => setBed(selected as BedModel)}
                selected={bed}
                error=""
                multiple={false}
                facility={facilityId}
                unoccupiedOnly
              />
            </div>
            <TextFormField
              label="Date of shift"
              id="start_date"
              name="start_date"
              value={startDate}
              type="datetime-local"
              onChange={(e) => setStartDate(e.value)}
              max={moment().format("YYYY-MM-DDTHH:mm")}
              error=""
            />
          </div>
          <div className="mt-4 flex flex-row justify-center">
            <div>
              <ButtonV2 variant="primary" type="submit">
                <i className="fas fa-bed" />
                Move to bed
              </ButtonV2>
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
            <div className="bg-primary-500 py-2 text-center font-bold text-white">
              Bed
            </div>
            <div className="bg-primary-500 py-2 text-center font-bold text-white">
              Location
            </div>
            <div className="bg-primary-500 py-2 text-center font-bold text-white">
              Start Date
            </div>
            <div className="bg-primary-500 py-2 text-center font-bold text-white">
              End Date
            </div>
          </div>
          {consultationBeds.length > 0 ? (
            consultationBeds.map((bed) => (
              <div className="grid grid-cols-4 gap-[1px]" key={bed?.id}>
                <div className="break-words bg-primary-100 p-2 text-center">
                  {bed?.bed_object?.name}
                </div>
                <div className="bg-primary-100 py-2 text-center">
                  {bed?.bed_object?.location_object?.name}
                </div>
                <div className="break-words bg-primary-100 p-2 text-center">
                  {formatDate(bed?.start_date)}
                </div>
                {bed?.end_date ? (
                  <div className="break-words bg-primary-100 p-2 text-center">
                    {formatDate(bed?.end_date)}
                  </div>
                ) : (
                  <div className="bg-primary-100 p-2 text-center">
                    <span className="rounded-full border border-yellow-500 bg-yellow-100 px-1 text-sm text-yellow-500 ">
                      In Use
                    </span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-primary-100 py-2 text-center">
              No beds allocated yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Beds;
