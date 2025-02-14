import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import ColoredIndicator from "@/CAREUI/display/ColoredIndicator";
import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import Loading from "@/components/Common/Loading";

import mutate from "@/Utils/request/mutate";
import { formatTimeShort } from "@/Utils/utils";
import { ScheduleException } from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";

interface Props {
  items?: ScheduleException[];
  facilityId: string;
  userId: string;
}

export default function ScheduleExceptions({
  items,
  facilityId,
  userId,
}: Props) {
  const { t } = useTranslation();

  if (items == null) {
    return <Loading />;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center text-center text-gray-500 py-16">
        <CareIcon icon="l-calendar-slash" className="size-10 mb-3" />
        <p>{t("no_scheduled_exceptions_found")}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {items.map((exception) => (
        <li key={exception.id}>
          <ScheduleExceptionItem
            {...exception}
            facilityId={facilityId}
            userId={userId}
          />
        </li>
      ))}
    </ul>
  );
}

const ScheduleExceptionItem = (
  props: ScheduleException & { facilityId: string; userId: string },
) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { mutate: deleteException, isPending } = useMutation({
    mutationFn: mutate(scheduleApis.exceptions.delete, {
      pathParams: {
        id: props.id,
        facility_id: props.facilityId,
      },
    }),
    onSuccess: () => {
      toast.success(t("exception_deleted"));
      queryClient.invalidateQueries({
        queryKey: [
          "user-schedule-exceptions",
          { facilityId: props.facilityId, userId: props.userId },
        ],
      });
    },
  });

  return (
    <div
      className={cn(
        "rounded-lg bg-white py-2 shadow",
        isPending && "opacity-50",
      )}
    >
      <div className="flex items-center justify-between py-2 pr-4">
        <div className="flex">
          <ColoredIndicator className="my-1 mr-2.5 h-5 w-1.5 rounded-r" />
          <div className="flex flex-col">
            <span className="space-x-1 text-lg font-semibold text-gray-700">
              {props.reason}
            </span>
            <span className="text-sm text-gray-500">
              <span className="font-medium">
                {formatTimeShort(props.start_time)} -{" "}
                {formatTimeShort(props.end_time)}
              </span>
              <span> {t("from")} </span>
              <span className="font-medium">
                {format(parseISO(props.valid_from), "EEE, dd MMM yyyy")}
              </span>
              <span> {t("to")} </span>
              <span className="font-medium">
                {format(parseISO(props.valid_to), "EEE, dd MMM yyyy")}
              </span>
            </span>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={isPending}
          onClick={() => deleteException(undefined)}
        >
          <CareIcon icon="l-minus-circle" className="text-base" />
          <span className="ml-2">{t("remove")}</span>
        </Button>
      </div>
      {/* TODO: Add this information */}
      {/* <div className="px-4 py-2">
        <Callout className="mt-2" variant="warning" badge="Warning">
          (TODO: Placeholder; replace this) 3 booked appointments were cancelled
          when you marked this leave. These may need to be rescheduled.
        </Callout>
      </div> */}
    </div>
  );
};
