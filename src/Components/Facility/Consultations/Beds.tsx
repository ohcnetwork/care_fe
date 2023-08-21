import * as Notification from "../../../Utils/Notifications.js";

import { BedModel, CurrentBed } from "../models";
import { Dispatch, SetStateAction, useCallback, useState } from "react";
import {
  createConsultationBed,
  listConsultationBeds,
} from "../../../Redux/actions";
import { statusType, useAbortableEffect } from "../../../Common/utils";

import { BedSelect } from "../../Common/BedSelect";
import ButtonV2 from "../../Common/components/ButtonV2";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import CircularProgress from "../../Common/components/CircularProgress.js";
import { FieldLabel } from "../../Form/FormFields/FormField";
import Loading from "../../Common/Loading";
import TextFormField from "../../Form/FormFields/TextFormField";
import { formatDateTime } from "../../../Utils/utils";
import { useDispatch } from "react-redux";
import dayjs from "../../../Utils/dayjs";
import { AssetSelect } from "../../Common/AssetSelect.js";
import DialogModal from "../../Common/Dialog.js";
import AssetsList from "../../Assets/AssetsList.js";
import { Link } from "raviger";
import { AssetData, assetClassProps } from "../../Assets/AssetTypes.js";
import Chip from "../../../CAREUI/display/Chip.js";

interface BedsProps {
  facilityId: string;
  patientId: string;
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
  const [bed, setBed] = useState<BedModel>({});
  const [startDate, setStartDate] = useState<string>(
    dayjs().format("YYYY-MM-DDTHH:mm")
  );
  const [assets, setAssets] = useState<any[]>([]);
  const [consultationBeds, setConsultationBeds] = useState<CurrentBed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [key, setKey] = useState(0);
  const [showBedDetails, setShowBedDetails] = useState<CurrentBed | null>(null);

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
          setConsultationBeds(bedsData.data.results);
          setBed(bedsData.data.results[0]?.bed_object || {});
          setAssets(bedsData.data.results[0]?.assets_objects || []);
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
      createConsultationBed(
        { start_date: startDate, assets: assets.map((asset) => asset.id) },
        consultationId,
        bed?.id
      )
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
      <DialogModal
        title={showBedDetails?.bed_object.name}
        show={showBedDetails !== null}
        onClose={() => setShowBedDetails(null)}
        className="md:max-w-2xl"
      >
        <div>Linked Assets:</div>
        {showBedDetails?.assets_objects?.length === 0 && (
          <div className="text-center">No assets linked</div>
        )}
        {showBedDetails?.assets_objects?.map((asset: AssetData) => (
          <Link
            key={asset.id}
            href={`/facility/${asset?.location_object.facility.id}/assets/${asset.id}`}
            className="mx-2 text-inherit"
            data-testid="created-asset-list"
          >
            <div
              key={asset.id}
              className="border-1 w-full cursor-pointer items-center justify-center rounded-lg border border-transparent bg-white p-5 shadow hover:border-primary-500"
            >
              <div className="md:flex">
                <p className="flex break-words text-xl font-medium capitalize">
                  <span className="mr-2 text-primary-500">
                    <CareIcon
                      className={`care-l-${
                        (
                          (asset.asset_class &&
                            assetClassProps[asset.asset_class]) ||
                          assetClassProps.NONE
                        ).icon
                      } text-2xl`}
                    />
                  </span>
                  <p
                    className="w-48 truncate"
                    data-testid="created-asset-list-name"
                  >
                    {asset.name}
                  </p>
                </p>
              </div>
              <p className="text-sm font-normal">
                <span className="text-sm font-medium">
                  <CareIcon className="care-l-location-point mr-1 text-primary-500" />
                  {asset?.location_object?.name}
                </span>
                <span className="ml-2 text-sm font-medium">
                  <CareIcon className="care-l-hospital mr-1 text-primary-500" />
                  {asset?.location_object?.facility?.name}
                </span>
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {asset.is_working ? (
                  <Chip startIcon="l-cog" text="Working" />
                ) : (
                  <Chip variant="danger" startIcon="l-cog" text="Not Working" />
                )}
              </div>
            </div>
          </Link>
        ))}
      </DialogModal>
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
              max={dayjs().format("YYYY-MM-DDTHH:mm")}
              error=""
            />
            <div>
              <FieldLabel id="assets-link-label">Link Assets</FieldLabel>
              <AssetSelect
                name="assets"
                setSelected={setAssets}
                selected={assets}
                multiple={true}
                facility={facilityId}
                in_use_by_consultation={false}
                is_permanent={false}
              />
            </div>
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
                  {bed?.assets_objects && bed.assets_objects.length > 0 && (
                    <span
                    className={` bg-primary-500 font-semibold text-white ml-2 h-6 cursor-pointer rounded-md px-2 text-xs`}
                    onClick={() => setShowBedDetails(bed)}
                  >
                    {bed.assets_objects.length}
                  </span>
                  )}
                </div>
                <div className="bg-primary-100 py-2 text-center">
                  {bed?.bed_object?.location_object?.name}
                </div>
                <div className="break-words bg-primary-100 p-2 text-center">
                  {formatDateTime(bed?.start_date)}
                </div>
                {bed?.end_date ? (
                  <div className="break-words bg-primary-100 p-2 text-center">
                    {formatDateTime(bed?.end_date)}
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
