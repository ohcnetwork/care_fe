import Timeline, { TimelineNode } from "../../../../CAREUI/display/Timeline";
import { classNames, formatDateTime } from "../../../../Utils/utils";
import { CurrentBed } from "../../models";

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
        }}
        titleSuffix={<BedTitleSuffix bed={bed} isLastNode={isLastNode} />}
        actions={
          bed.end_date === null && (
            <p className="mr-10 self-center rounded-full border border-yellow-600 bg-yellow-500 px-2 py-1 text-xs font-semibold text-white hover:bg-red-500">
              IN USE
            </p>
          )
        }
        isLast={isLastNode}
      />
    </>
  );
};

const BedTitleSuffix = ({ bed }: { bed: CurrentBed; isLastNode?: boolean }) => {
  return (
    <div className="flex flex-col">
      <p
        className={classNames("font-semibold")}
      >{`${bed.bed_object.name} (${bed.bed_object.bed_type}) | ${bed.bed_object.location_object?.name}`}</p>
      <p className="mt-1 text-xs text-gray-500">
        {`${formatDateTime(bed.start_date).split(";")[0]} | ${
          formatDateTime(bed.start_date).split(";")[1]
        }`}
      </p>
    </div>
  );
};
