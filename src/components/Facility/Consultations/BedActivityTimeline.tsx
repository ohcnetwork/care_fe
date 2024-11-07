import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import { useTranslation } from "react-i18next";

import Chip from "@/CAREUI/display/Chip";
import Timeline, {
  TimelineEvent,
  TimelineNode,
  TimelineNodeTitle,
} from "@/CAREUI/display/Timeline";
import CareIcon from "@/CAREUI/icons/CareIcon";

import { AssetData } from "@/components/Assets/AssetTypes";
import { CurrentBed } from "@/components/Facility/models";

import { classNames, formatDateTime, relativeTime } from "@/Utils/utils";

interface AssetDiff {
  newlyLinkedAssets: AssetData[];
  existingAssets: AssetData[];
  unlinkedAssets: AssetData[];
}

const getAssetDiff = (a: AssetData[], b: AssetData[]): AssetDiff => {
  const newlyLinkedAssets: AssetData[] = [];
  const existingAssets: AssetData[] = [];
  const unlinkedAssets: AssetData[] = [];

  const bMap: Map<string, AssetData> = new Map();
  b.forEach((asset) => bMap.set(asset.id, asset));
  a.forEach((asset) => {
    if (!bMap.has(asset.id)) {
      unlinkedAssets.push(asset);
    } else {
      existingAssets.push(asset);
    }
  });
  b.forEach((asset) => {
    if (!a.find((aAsset) => aAsset.id === asset.id)) {
      newlyLinkedAssets.push(asset);
    }
  });

  return {
    newlyLinkedAssets,
    existingAssets,
    unlinkedAssets,
  };
};

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
          loading && "animate-pulse opacity-70",
        )}
        name="bed-allocation"
      >
        {consultationBeds.map((bed, index) => {
          return (
            <BedAllocationNode
              key={`activity-${bed.id}`}
              bed={bed}
              prevBed={consultationBeds[index + 1] ?? undefined}
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
  prevBed,
  isLastNode,
}: {
  bed: CurrentBed;
  prevBed?: CurrentBed;
  isLastNode: boolean;
}) => {
  const { newlyLinkedAssets, existingAssets, unlinkedAssets } = getAssetDiff(
    prevBed?.assets_objects ?? [],
    bed.assets_objects ?? [],
  );
  const event: TimelineEvent = {
    type: "allocated",
    timestamp: bed.start_date,
    by: undefined,
    icon: "l-bed",
    iconWrapperStyle: bed.end_date === null ? "bg-green-500" : "",
    iconStyle: bed.end_date === null ? "text-white" : "",
    notes:
      newlyLinkedAssets.length === 0 &&
      existingAssets.length === 0 &&
      unlinkedAssets.length === 0 ? (
        ""
      ) : (
        <BedTimelineAsset
          newlyLinkedAssets={newlyLinkedAssets}
          existingAssets={existingAssets}
          unlinkedAssets={unlinkedAssets}
        />
      ),
  };

  return (
    <>
      <TimelineNode
        name="bed"
        event={event}
        title={
          <BedTimelineNodeTitle
            event={event}
            titleSuffix={<BedTitleSuffix bed={bed} prevBed={prevBed} />}
            bed={bed}
          />
        }
        isLast={isLastNode}
      />
    </>
  );
};

const BedTimelineAsset = ({
  newlyLinkedAssets,
  existingAssets,
  unlinkedAssets,
}: {
  newlyLinkedAssets: AssetData[];
  existingAssets: AssetData[];
  unlinkedAssets: AssetData[];
}) => {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-md font-semibold">Assets</p>
      {newlyLinkedAssets.length === 0 &&
        existingAssets.length === 0 &&
        unlinkedAssets.length === 0 && (
          <p className="text-secondary-500">No assets linked</p>
        )}
      {newlyLinkedAssets.length > 0 &&
        newlyLinkedAssets.map((newAsset) => (
          <div key={newAsset.id} className="flex gap-1 text-primary">
            <CareIcon icon="l-plus-circle" />
            <span>{newAsset.name}</span>
          </div>
        ))}
      {existingAssets.length > 0 &&
        existingAssets.map((existingAsset) => (
          <div key={existingAsset.id} className="flex gap-1">
            <CareIcon icon="l-check-circle" />
            <span>{existingAsset.name}</span>
          </div>
        ))}
      {unlinkedAssets.length > 0 &&
        unlinkedAssets.map((unlinkedAsset) => (
          <div key={unlinkedAsset.id} className="flex gap-1 text-secondary-500">
            <CareIcon icon="l-minus-circle" />
            <span className="line-through">{unlinkedAsset.name}</span>
          </div>
        ))}
    </div>
  );
};

const BedTimelineNodeTitle = (props: {
  event: TimelineEvent;
  titleSuffix: React.ReactNode;
  bed: CurrentBed;
}) => {
  const { event, titleSuffix, bed } = props;

  return (
    <TimelineNodeTitle event={event}>
      <div className="flex w-full justify-between gap-2">
        <p className="flex-auto py-0.5 text-xs leading-5 text-secondary-600 md:w-2/3">
          {titleSuffix}
        </p>
        <div className="md:w-fit">
          <BedActivityIButtonPopover bed={bed} />
        </div>
      </div>
    </TimelineNodeTitle>
  );
};

const BedTitleSuffix = ({
  bed,
  prevBed,
}: {
  bed: CurrentBed;
  isLastNode?: boolean;
  prevBed?: CurrentBed;
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col">
      <div className="flex gap-x-2">
        <span>{formatDateTime(bed.start_date).split(";")[0]}</span>
        <span className="text-secondary-500">-</span>
        <span>{formatDateTime(bed.start_date).split(";")[1]}</span>
      </div>
      <p>
        {bed.bed_object.id === prevBed?.bed_object.id
          ? "Asset changed in" + " "
          : "Transferred to" + " "}
        <span className="font-semibold">{`${bed.bed_object.name} (${t(bed.bed_object.bed_type!)}) in ${bed.bed_object.location_object?.name}`}</span>
        {bed.end_date === null && (
          <Chip
            text="In Use"
            startIcon="l-notes"
            size="small"
            variant="primary"
            className="ml-5"
          />
        )}
      </p>
    </div>
  );
};

const BedActivityIButtonPopover = ({
  bed,
}: {
  event?: TimelineEvent;
  bed?: CurrentBed;
}) => {
  return (
    <Popover className="relative text-sm text-secondary-500 md:text-base">
      <PopoverButton>
        <CareIcon
          icon="l-info-circle"
          className="cursor-pointer text-secondary-500 hover:text-secondary-600"
        />
      </PopoverButton>
      <Transition
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <PopoverPanel className="absolute z-10 -ml-20 mt-2 w-48 -translate-x-1/2 rounded-lg border border-secondary-200 bg-secondary-100 p-2 shadow">
          <p className="text-xs text-secondary-600">
            updated {relativeTime(bed?.start_date)}
          </p>
        </PopoverPanel>
      </Transition>
    </Popover>
  );
};
