import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isSameDay, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import ColoredIndicator from "@/CAREUI/display/ColoredIndicator";
import CareIcon from "@/CAREUI/icons/CareIcon";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";

import Loading from "@/components/Common/Loading";

import mutate from "@/Utils/request/mutate";
import { formatTimeShort } from "@/Utils/utils";
import { useIsUserSchedulableResource } from "@/pages/Scheduling/useIsUserSchedulableResource";
import {
  SchedulableResourceType,
  ScheduleException,
} from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";

interface Props {
  items?: ScheduleException[];
  facilityId: string;
  resourceType: SchedulableResourceType;
  resourceId: string;
}

export default function ScheduleExceptions({
  items,
  facilityId,
  resourceType,
  resourceId,
}: Props) {
  const { t } = useTranslation();

  const { data: isSchedulableResource } = useIsUserSchedulableResource(
    facilityId,
    resourceId,
  );

  if (items == null) {
    return <Loading />;
  }

  if (!isSchedulableResource) {
    return (
      <div className="flex flex-col items-center text-center text-gray-500 py-16">
        <CareIcon icon="l-calendar-slash" className="size-10 mb-3" />
        <p>{t("exception_for_non_schedulable_resource_warning")}</p>
      </div>
    );
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
            resourceType={resourceType}
            resourceId={resourceId}
          />
        </li>
      ))}
    </ul>
  );
}

const ScheduleExceptionItem = (
  props: ScheduleException & {
    facilityId: string;
    resourceId: string;
    resourceType: SchedulableResourceType;
  },
) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { mutate: deleteException, isPending } = useMutation({
    mutationFn: mutate(scheduleApis.exceptions.delete, {
      pathParams: {
        id: props.id,
        facilityId: props.facilityId,
      },
    }),
    onSuccess: () => {
      toast.success(t("exception_deleted"));
      queryClient.invalidateQueries({
        queryKey: [
          "scheduleExceptions",
          props.facilityId,
          { resourceType: props.resourceType, resourceId: props.resourceId },
        ],
      });
    },
  });
  const fromDate = parseISO(props.valid_from);
  const toDate = parseISO(props.valid_to);
  return (
    <div
      className={cn(
        "rounded-lg bg-white py-2 shadow-sm",
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
              {isSameDay(fromDate, toDate) ? (
                <>
                  <span> {t("on")} </span>
                  <span className="font-medium">
                    {format(fromDate, "EEE, dd MMM yyyy")}
                  </span>
                </>
              ) : (
                <>
                  <span> {t("from")} </span>
                  <span className="font-medium">
                    {format(fromDate, "EEE, dd MMM yyyy")}
                  </span>
                  <span> {t("to")} </span>
                  <span className="font-medium">
                    {format(toDate, "EEE, dd MMM yyyy")}
                  </span>
                </>
              )}
            </span>
          </div>
        </div>
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogTrigger asChild>
            <Button variant="secondary" size="sm" disabled={isPending}>
              <CareIcon icon="l-minus-circle" className="text-base" />
              <span className="ml-2">{t("remove")}</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("are_you_sure")}</AlertDialogTitle>
              <AlertDialogDescription>
                <Alert variant="destructive" className="mt-4">
                  <AlertTitle>{t("warning")}</AlertTitle>
                  <AlertDescription>
                    {t(
                      "this_will_permanently_remove_the_exception_and_cannot_be_undone",
                    )}
                  </AlertDescription>
                </Alert>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
                {t("cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                className={cn(buttonVariants({ variant: "destructive" }))}
                onClick={() => {
                  deleteException();
                  setIsDeleteDialogOpen(false);
                }}
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  t("confirm")
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
