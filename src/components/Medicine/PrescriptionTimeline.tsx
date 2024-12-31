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
import MedicineRoutes from "@/components/Medicine/routes";

import useSlug from "@/hooks/useSlug";

import dayjs from "@/Utils/dayjs";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import { classNames, formatDateTime, formatTime } from "@/Utils/utils";
import { MedicationAdministration } from "@/types/emr/medicationAdministration";
import { MedicationRequest } from "@/types/emr/medicationRequest";

import { useEncounter } from "../Facility/ConsultationDetails/EncounterContext";
import { isMedicationDiscontinued } from "./MedicineAdministrationSheet/utils";

interface MedicineAdministeredEvent extends TimelineEvent<"administered"> {
  administration: MedicationAdministration;
}

type PrescriptionTimelineEvents =
  | TimelineEvent<"created" | "discontinued">
  | MedicineAdministeredEvent;

interface Props {
  interval: { start: Date; end: Date };
  prescription: MedicationRequest;
  showPrescriptionDetails?: boolean;
  onRefetch?: () => void;
  readonly?: boolean;
}

export default function PrescriptionTimeline({
  prescription,
  interval,
  onRefetch,
  readonly,
}: Props) {
  const encounterId = useSlug("encounter");
  const { patient } = useEncounter();

  const { data, refetch, loading } = useTanStackQueryInstead(
    routes.medicationAdministration.list,
    {
      pathParams: { patientId: patient!.id },
      query: {
        encounter: encounterId,
        request: prescription.id,
        occurrence_period_end_after: formatDateTime(
          interval.start,
          "YYYY-MM-DD",
        ),
        occurrence_period_end_before: formatDateTime(
          interval.end,
          "YYYY-MM-DD",
        ),
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
                hideArchive={isMedicationDiscontinued(prescription) || readonly}
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
  const encounterId = useSlug("encounter");
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
          event.administration.occurrence_period_end,
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
                // time={event.administration.archived_on}
                user={event.administration.updated_by}
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
            pathParams: {
              encounter: encounterId,
              external_id: event.administration.id!,
            },
          }); // FIXME: remove archiving or wire up the correct API

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
  prescription: MedicationRequest,
  administrations: MedicationAdministration[],
  interval: { start: Date; end: Date },
): PrescriptionTimelineEvents[] => {
  const events: PrescriptionTimelineEvents[] = [];

  if (dayjs(prescription.authored_on).isBetween(interval.start, interval.end)) {
    events.push({
      type: "created",
      icon: "l-plus-circle",
      timestamp: prescription.authored_on,
      by: prescription.created_by,
      notes: prescription.note,
    });
  }

  administrations
    .sort(
      (a, b) =>
        new Date(a.occurrence_period_end!).getTime() -
        new Date(b.occurrence_period_end!).getTime(),
    )
    .forEach((administration) => {
      events.push({
        type: "administered",
        icon: "l-syringe",
        timestamp: administration.occurrence_period_end!,
        by: administration.created_by,
        cancelled: administration.status === "entered_in_error",
        administration,
        notes: administration.note,
      });
    });

  if (
    isMedicationDiscontinued(prescription) &&
    dayjs(prescription.status_changed).isBetween(interval.start, interval.end)
  ) {
    events.push({
      type: "discontinued",
      icon: "l-times-circle",
      timestamp: prescription.status_changed!,
      by: undefined,
      notes: prescription.status_reason,
    });
  }

  return events;
};
