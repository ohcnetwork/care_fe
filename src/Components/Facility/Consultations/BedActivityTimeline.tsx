import Timeline, { TimelineNode } from "../../../CAREUI/display/Timeline";
import { classNames, formatDateTime } from "../../../Utils/utils";
import { AssetData } from "../../Assets/AssetTypes";
import { CurrentBed } from "../models";

interface Props {
  consultationBeds: CurrentBed[];
  loading?: boolean;
}

export default function BedActivityTimeline({
  consultationBeds,
  loading,
}: Props) {
  return (
    <>
      <Timeline
        className={classNames(
          "py-4 md:px-3",
          loading && "animate-pulse opacity-70"
        )}
        name="bed"
      >
        {consultationBeds.map((bed, index) => {
          return (
            <BedAllocationNode
              key={`activity-${bed.id}`}
              bed={bed}
              isLastNode={index === consultationBeds.length - 1}
            />
          );
        })}
      </Timeline>
    </>
  );
}

const BedAllocationNode = ({
  bed,
  isLastNode,
}: {
  bed: CurrentBed;
  isLastNode: boolean;
}) => {
  return (
    <>
      <TimelineNode
        name="bed"
        event={{
          type: "allocated",
          timestamp: bed.start_date,
          by: undefined,
          icon: bed.end_date === null ? "l-map-pin-alt" : "l-bed",
          notes: bed.assets_objects?.length ? (
            <BedTimelineAsset assets={bed.assets_objects} />
          ) : (
            ""
          ),
        }}
        titleSuffix={<BedTitleSuffix bed={bed} isLastNode={isLastNode} />}
        isLast={isLastNode}
      />
    </>
  );
};

const BedTitleSuffix = ({ bed }: { bed: CurrentBed; isLastNode?: boolean }) => {
  return (
    <div className="flex flex-col">
      <div className="flex gap-x-2">
        <span>{formatDateTime(bed.start_date).split(";")[0]}</span>
        <span className="text-gray-500">-</span>
        <span>{formatDateTime(bed.start_date).split(";")[1]}</span>
      </div>
      <p>
        {bed.end_date === null ? "Currently occupying" : "Transferred to"}{" "}
        <span className="font-semibold">{`${bed.bed_object.name} (${bed.bed_object.bed_type}) in ${bed.bed_object.location_object?.name}`}</span>
      </p>
    </div>
  );
};

const BedTimelineAsset = ({ assets }: { assets: AssetData[] }) => {
  return (
    <div className="flex flex-col">
      <p className="font-semibold">Linked Assets</p>
      <div className="ml-5 flex flex-col">
        {assets.map((asset) => {
          return (
            <li key={asset.id} className="list-disc">
              {asset.name}
            </li>
          );
        })}
      </div>
    </div>
  );
};
