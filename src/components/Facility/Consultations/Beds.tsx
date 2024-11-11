import { Link } from "raviger";
import { Dispatch, SetStateAction, useState } from "react";

import Chip from "@/CAREUI/display/Chip";
import CareIcon from "@/CAREUI/icons/CareIcon";

import {
  AssetClass,
  AssetData,
  assetClassProps,
} from "@/components/Assets/AssetTypes";
import { AssetSelect } from "@/components/Common/AssetSelect";
import { BedSelect } from "@/components/Common/BedSelect";
import ButtonV2 from "@/components/Common/ButtonV2";
import CircularProgress from "@/components/Common/CircularProgress";
import DialogModal from "@/components/Common/Dialog";
import Loading from "@/components/Common/Loading";
import BedActivityTimeline from "@/components/Facility/Consultations/BedActivityTimeline";
import { BedModel, CurrentBed } from "@/components/Facility/models";
import DateFormField from "@/components/Form/FormFields/DateFormField.js";
import { FieldLabel } from "@/components/Form/FormFields/FormField";

import * as Notification from "@/Utils/Notifications";
import dayjs from "@/Utils/dayjs";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";

interface BedsProps {
  facilityId: string;
  consultationId: string;
  smallLoader?: boolean;
  discharged?: boolean;
  setState?: Dispatch<SetStateAction<boolean>>;
  fetchPatientData?: (state: { aborted: boolean }) => void;
  hideTitle?: boolean;
}

const Beds = (props: BedsProps) => {
  const { facilityId, consultationId, discharged } = props;
  const [bed, setBed] = useState<BedModel>({});
  const [startDate, setStartDate] = useState<string>(
    dayjs().format("YYYY-MM-DDTHH:mm"),
  );
  const [assets, setAssets] = useState<any[]>([]);
  const [consultationBeds, setConsultationBeds] = useState<CurrentBed[]>([]);
  const [key, setKey] = useState(0);
  const [showBedDetails, setShowBedDetails] = useState<CurrentBed | null>(null);

  const { loading } = useQuery(routes.listConsultationBeds, {
    query: { consultation: consultationId },
    onResponse: ({ res, data }) => {
      if (res && res.status === 200 && data?.results) {
        setConsultationBeds(data.results);
        setBed(data?.results[0]?.bed_object || {});
        setAssets(data?.results[0]?.assets_objects || []);
      } else {
        Notification.Error({
          msg: "Something went wrong..!",
        });
      }
    },
  });

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (!bed?.id)
      return Notification.Error({
        msg: "Please select a bed first..!",
      });

    const { res } = await request(routes.createConsultationBed, {
      body: {
        start_date: startDate,
        assets: assets.map((asset) => asset.id),
        consultation: consultationId,
        bed: bed?.id,
      },
    });

    if (res && res.status === 201) {
      Notification.Success({
        msg: "Bed allocated successfully",
      });
      props.fetchPatientData?.({ aborted: false });
      if (props.setState) props.setState(false);
      setKey(key + 1);
    }
  };

  if (loading) {
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
            href={`/facility/${asset?.location_object.facility?.id}/assets/${asset.id}`}
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
                      icon={
                        (
                          (asset.asset_class &&
                            assetClassProps[asset.asset_class]) ||
                          assetClassProps.NONE
                        ).icon
                      }
                      className="text-2xl"
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
                  <CareIcon
                    icon="l-location-point"
                    className="mr-1 text-primary-500"
                  />
                  {asset?.location_object?.name}
                </span>
                <span className="ml-2 text-sm font-medium">
                  <CareIcon
                    icon="l-hospital"
                    className="mr-1 text-primary-500"
                  />
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
              <CareIcon icon="l-times" className="text-lg" />
            </ButtonV2>
          )}
        </div>
      )}
      {!discharged ? (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-2">
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
            <DateFormField
              label="Date of shift"
              id="start_date"
              name="start_date"
              value={startDate ? new Date(startDate) : new Date()}
              onChange={(e) =>
                setStartDate(dayjs(e.value).format("YYYY-MM-DDTHH:mm"))
              }
              max={new Date()}
              error=""
              errorClassName="hidden"
              allowTime
            />
            <div>
              <FieldLabel id="assets-link-label">Link Assets</FieldLabel>
              <AssetSelect
                name="assets"
                setSelected={setAssets}
                selected={assets}
                multiple={true}
                asset_class={AssetClass.VENTILATOR}
                facility={facilityId}
                in_use_by_consultation={false}
                is_permanent={false}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-row justify-end">
            <div>
              <ButtonV2 variant="primary" type="submit" id="update-switchbed">
                <CareIcon icon="l-bed" className="text-xl" />
                Update
              </ButtonV2>
            </div>
          </div>
        </form>
      ) : (
        ""
      )}
      <div>
        <hr className="mt-4 border-t-2" />
        <h3 className="my-4 text-lg">Previous beds: </h3>
        {consultationBeds.length > 0 ? (
          <BedActivityTimeline
            consultationBeds={consultationBeds}
            loading={loading}
          />
        ) : (
          <div className="flex w-full justify-center border-2 border-secondary-200 bg-white p-5 text-center text-2xl font-bold text-secondary-500">
            <span className="flex justify-center rounded-lg bg-white p-3 text-secondary-700">
              No beds allocated yet
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Beds;
