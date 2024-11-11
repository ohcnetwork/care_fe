import { useState } from "react";

import RecordMeta from "@/CAREUI/display/RecordMeta";
import Timeline, {
  TimelineEvent,
  TimelineNode,
  TimelineNodeNotes,
} from "@/CAREUI/display/Timeline";
import CareIcon from "@/CAREUI/icons/CareIcon";
import { AuthorizedForConsultationRelatedActions } from "@/CAREUI/misc/AuthorizedChild";

import ButtonV2 from "@/components/Common/ButtonV2";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import {
  MedicineAdministrationRecord,
  Prescription,
} from "@/components/Medicine/models";
import MedicineRoutes from "@/components/Medicine/routes";

import useSlug from "@/hooks/useSlug";

import dayjs from "@/Utils/dayjs";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";
import { classNames, formatDateTime, formatTime } from "@/Utils/utils";

interface MedicineAdministeredEvent extends TimelineEvent<"administered"> {
  administration: MedicineAdministrationRecord;
}

type PrescriptionTimelineEvents =
  | TimelineEvent<"created" | "discontinued">
  | MedicineAdministeredEvent;

interface Props {
  interval: { start: Date; end: Date };
  prescription: Prescription;
  showPrescriptionDetails?: boolean;
  onRefetch?: () => void;
  readonly?: boolean;
}

export default function PrescrpitionTimeline({
  prescription,
  interval,
  onRefetch,
  readonly,
}: Props) {
  const consultation = useSlug("consultation");
  const { data, refetch, loading } = useQuery(
    MedicineRoutes.listAdministrations,
    {
      pathParams: { consultation },
      query: {
        prescription: prescription.id,
        administered_date_after: formatDateTime(interval.start, "YYYY-MM-DD"),
        administered_date_before: formatDateTime(interval.end, "YYYY-MM-DD"),
      },
    },
  );

  const events = data && compileEvents(prescription, data.results, interval);

  if (loading && !data) {
    return (
      <div className="my-8 flex justify-center">
        <CareIcon icon="l-spinner" className="animate-spin text-2xl" />
      </div>
    );
  }

  return (
    <Timeline
      className={classNames(
        "py-4 md:px-3",
        loading && data && "animate-pulse opacity-70",
      )}
      name="prescription"
    >
      {events?.map((event, index) => {
        switch (event.type) {
          case "created":
          case "discontinued":
            return (
              <TimelineNode
                key={`activity-${event.type}-${prescription.id}`}
                event={event}
                isLast={index === events.length - 1}
              />
            );

          case "administered":
            return (
              <MedicineAdministeredNode
                key={`activity-${event.type}-${prescription.id}`}
                event={event}
                onArchived={() => {
                  onRefetch?.();
                  refetch();
                }}
                isLastNode={index === events.length - 1}
                hideArchive={prescription.discontinued || readonly}
              />
            );
        }
      })}
    </Timeline>
  );
}

const MedicineAdministeredNode = ({
  event,
  onArchived,
  isLastNode,
  hideArchive,
}: {
  event: MedicineAdministeredEvent;
  onArchived: () => void;
  isLastNode: boolean;
  hideArchive?: boolean;
}) => {
  const consultation = useSlug("consultation");
  const [showArchiveConfirmation, setShowArchiveConfirmation] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  return (
    <>
      <TimelineNode
        name="medicine"
        event={event}
        className={classNames(event.cancelled && "opacity-70")}
        titleSuffix={`administered ${
          event.administration.dosage
            ? event.administration.dosage + " dose of "
            : ""
        }the medicine at ${formatTime(
          event.administration.administered_date,
        )}.`}
        actions={
          !event.cancelled &&
          !hideArchive && (
            <AuthorizedForConsultationRelatedActions>
              <ButtonV2
                size="small"
                border
                ghost
                variant="secondary"
                onClick={() => setShowArchiveConfirmation(true)}
              >
                Archive
              </ButtonV2>
            </AuthorizedForConsultationRelatedActions>
          )
        }
        isLast={isLastNode}
      >
        {event.cancelled && (
          <TimelineNodeNotes icon="l-archive">
            <span className="md:flex md:gap-1">
              Prescription was archived{" "}
              <RecordMeta
                time={event.administration.archived_on}
                user={event.administration.administered_by}
                inlineUser
              />
            </span>
          </TimelineNodeNotes>
        )}
      </TimelineNode>
      <ConfirmDialog
        show={showArchiveConfirmation}
        disabled={isArchiving}
        variant="warning"
        title="Archive Administration"
        description="Are you sure you want to archive this administration?"
        action="Archive"
        onConfirm={async () => {
          setIsArchiving(true);

          const { res } = await request(MedicineRoutes.archiveAdministration, {
            pathParams: { consultation, external_id: event.administration.id },
          });

          if (res?.status === 200) {
            setIsArchiving(false);
            setShowArchiveConfirmation(false);
            onArchived();
          }
        }}
        onClose={() => setShowArchiveConfirmation(false)}
      />
    </>
  );
};

const compileEvents = (
  prescription: Prescription,
  administrations: MedicineAdministrationRecord[],
  interval: { start: Date; end: Date },
): PrescriptionTimelineEvents[] => {
  const events: PrescriptionTimelineEvents[] = [];

  if (
    dayjs(prescription.created_date).isBetween(interval.start, interval.end)
  ) {
    events.push({
      type: "created",
      icon: "l-plus-circle",
      timestamp: prescription.created_date,
      by: prescription.prescribed_by,
      notes: prescription.notes,
    });
  }

  administrations
    .sort(
      (a, b) =>
        new Date(a.administered_date!).getTime() -
        new Date(b.administered_date!).getTime(),
    )
    .forEach((administration) => {
      events.push({
        type: "administered",
        icon: "l-syringe",
        timestamp: administration.administered_date!,
        by: administration.administered_by,
        cancelled: !!administration.archived_on,
        administration,
        notes: administration.notes,
      });
    });

  if (
    prescription?.discontinued &&
    dayjs(prescription.discontinued_date).isBetween(
      interval.start,
      interval.end,
    )
  ) {
    events.push({
      type: "discontinued",
      icon: "l-times-circle",
      timestamp: prescription.discontinued_date,
      by: undefined,
      notes: prescription.discontinued_reason,
    });
  }

  return events;
};
