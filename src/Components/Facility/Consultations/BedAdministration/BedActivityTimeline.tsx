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
              isLastNode={index === 0}
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
          icon: "l-bed",
        }}
        titleSuffix={`${bed.bed_object.name} (${
          bed.bed_object.bed_type
        }) was allocated at ${formatDateTime(bed.start_date)} | ${
          bed.bed_object.location_object?.name
        }`}
        actions={
          isLastNode && (
            <p className="mr-10 rounded-full border border-yellow-600 bg-yellow-500 px-2 text-white">
              IN USE
            </p>
          )
        }
        isLast={isLastNode}
      />
    </>
  );
};
