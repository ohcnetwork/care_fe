import { useEffect, useState } from "react";
import { PerformedByModel } from "../HCX/misc";
import { MedicineAdministrationRecord, Prescription } from "./models";
import { classNames } from "../../Utils/utils";
import CareIcon, { IconName } from "../../CAREUI/icons/CareIcon";
import RecordMeta from "../../CAREUI/display/RecordMeta";
import { PrescriptionActions } from "../../Redux/actions";
import { useDispatch } from "react-redux";
import Spinner from "../Common/Spinner";
import ConfirmDialog from "../Common/ConfirmDialog";

interface Props {
  prescription: Prescription | undefined;
  actions: ReturnType<ReturnType<typeof PrescriptionActions>["prescription"]>;
  onArchiveAdministration?: (mar: MedicineAdministrationRecord) => void;
}

interface EventBase {
  timestamp: string;
  by: PerformedByModel | undefined;
}

interface PrescriptionCreatedEvent extends EventBase {
  type: "created";
  prescription: Prescription;
}

interface CommentEvent extends EventBase {
  type: "commented";
  comment: string;
}

interface PrescriptionDiscontinuedEvent extends EventBase {
  type: "discontinued";
  reason: string;
}

interface MedicineAdministrationEvent extends EventBase {
  type: "administered";
  administration: MedicineAdministrationRecord;
}

type Event =
  | PrescriptionCreatedEvent
  | CommentEvent
  | PrescriptionDiscontinuedEvent
  | MedicineAdministrationEvent;

const compileEvents = (
  prescription: Prescription | undefined,
  administrations: MedicineAdministrationRecord[]
): Event[] => {
  const events: Event[] = [];

  if (prescription) {
    events.push({
      type: "created",
      timestamp: prescription.created_date,
      prescription,
      by: prescription.prescribed_by,
    });
  }

  if (prescription?.notes) {
    events.push({
      type: "commented",
      timestamp: prescription.created_date,
      comment: prescription.notes,
      by: prescription.prescribed_by,
    });
  }

  administrations.forEach((administration) => {
    events.push({
      type: "administered",
      timestamp: administration.created_date,
      administration,
      by: administration.administered_by,
    });

    if (administration.notes) {
      events.push({
        type: "commented",
        timestamp: administration.created_date,
        comment: administration.notes,
        by: administration.administered_by,
      });
    }
  });

  if (prescription?.discontinued) {
    events.push({
      type: "discontinued",
      timestamp: prescription.discontinued_date,
      reason: prescription.discontinued_reason || "",
      by: undefined,
    });
  }

  return events;
};

export default function MedicineAdministrationEventsTimeline(props: Props) {
  const [events, setEvents] = useState<Event[]>();
  const dispatch = useDispatch<any>();
  const [selectedForArchive, setSelectedForArchive] =
    useState<MedicineAdministrationRecord>();
  const [archiving, setArchiving] = useState<boolean>(false);

  useEffect(() => {
    if (events) {
      return;
    }

    const fetchAdministrations = async () => {
      const res = await dispatch(props.actions.listAdministrations());
      if (res.status === 200) {
        const administrations = res.data.results.sort(
          (a: MedicineAdministrationRecord, b: MedicineAdministrationRecord) =>
            new Date(a.created_date).getTime() -
            new Date(b.created_date).getTime()
        );

        setEvents(compileEvents(props.prescription, administrations));
      }
    };

    fetchAdministrations();
  }, [events]);

  return (
    <div className="flex w-full flex-col gap-4 md:px-3">
      {selectedForArchive && (
        <ConfirmDialog
          show
          disabled={archiving}
          variant="warning"
          title="Archive Administration"
          description="Are you sure you want to archive this administration?"
          action="Archive"
          onConfirm={async () => {
            setArchiving(true);
            const res = await dispatch(
              props.actions.archive(selectedForArchive)
            );
            if (res.status === 200) {
              setEvents(undefined);
              setArchiving(false);
              setSelectedForArchive(undefined);
              props.onArchiveAdministration?.(selectedForArchive);
            }
          }}
          onClose={() => setSelectedForArchive(undefined)}
        />
      )}
      <h2 className="flex items-center gap-2 text-lg text-gray-900">
        <span>Activity</span>
        {events === undefined && <Spinner />}
      </h2>
      <div className="md:px-3">
        <ol role="list" className="space-y-6">
          {events?.map((activityItem, activityItemIdx) => (
            <li key={activityItemIdx} className="relative flex gap-x-4">
              <div
                className={classNames(
                  activityItemIdx === events.length - 1 ? "h-6" : "-bottom-6",
                  "absolute left-0 top-0 flex w-6 justify-center"
                )}
              >
                <div className="w-px bg-gray-300" />
              </div>
              {activityItem.type === "commented" ? (
                <>
                  <CareIcon
                    icon={eventIcons[activityItem.type]}
                    className="relative mt-3 flex-none rounded-full bg-gray-50 text-lg"
                  />
                  <div className="flex-auto rounded-md p-3 ring-1 ring-inset ring-gray-200">
                    <div className="flex justify-between gap-x-4">
                      <div className="py-0.5 text-xs leading-5 text-gray-500">
                        <span className="font-medium text-gray-900">
                          {activityItem.by?.first_name}{" "}
                          {activityItem.by?.last_name}
                        </span>{" "}
                        commented
                      </div>
                      <RecordMeta
                        className="flex-none py-0.5 text-xs leading-5 text-gray-500"
                        time={activityItem.timestamp}
                      />
                    </div>
                    <p className="text-sm leading-6 text-gray-700">
                      {activityItem.comment}
                    </p>
                  </div>
                </>
              ) : (
                <div
                  className={classNames(
                    "relative flex w-full gap-x-4",
                    activityItem.type === "administered" &&
                      !!activityItem.administration.archived_on &&
                      "opacity-60"
                  )}
                >
                  <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
                    <CareIcon
                      className="text-lg"
                      aria-hidden="true"
                      icon={eventIcons[activityItem.type]}
                    />
                  </div>
                  <p className="flex-auto py-0.5 text-xs leading-5 text-gray-500">
                    <span className="font-medium text-gray-900">
                      {activityItem.by?.first_name} {activityItem.by?.last_name}
                    </span>{" "}
                    {activityItem.type} the prescription.
                    {activityItem.type === "administered" && (
                      <>
                        {" "}
                        {activityItem.administration.archived_on ? (
                          <span className="inline-flex gap-1 whitespace-nowrap text-gray-500">
                            Archived{" "}
                            <RecordMeta
                              time={activityItem.administration.archived_on}
                              user={activityItem.administration.administered_by}
                            />
                          </span>
                        ) : (
                          props.onArchiveAdministration && (
                            <span
                              className="ml-1 cursor-pointer text-gray-600 underline"
                              onClick={() =>
                                setSelectedForArchive(
                                  activityItem.administration
                                )
                              }
                            >
                              Archive
                            </span>
                          )
                        )}
                      </>
                    )}
                  </p>
                  <RecordMeta
                    className="flex-none py-0.5 text-xs leading-5 text-gray-500"
                    time={activityItem.timestamp}
                  />
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

const eventIcons: Record<Event["type"], IconName> = {
  administered: "l-syringe",
  commented: "l-comment-alt-lines",
  created: "l-plus-circle",
  discontinued: "l-times-circle",
};
