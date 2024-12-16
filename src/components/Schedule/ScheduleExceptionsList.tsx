import { format, parseISO } from "date-fns";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import Callout from "@/CAREUI/display/Callout";
import ColoredIndicator from "@/CAREUI/display/ColoredIndicator";
import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import Loading from "@/components/Common/Loading";
import { ScheduleAPIs } from "@/components/Schedule/api";
import { ScheduleException } from "@/components/Schedule/types";

import useAuthUser from "@/hooks/useAuthUser";

import useMutation from "@/Utils/request/useMutation";

interface Props {
  items?: ScheduleException[];
  onRefresh?: () => void;
}

export default function ScheduleExceptionsList(props: Props) {
  if (props.items == null) {
    return <Loading />;
  }

  if (props.items.length === 0) {
    return (
      <div className="flex flex-col items-center text-center text-gray-500 py-64">
        <CareIcon icon="l-calendar-slash" className="size-10 mb-3" />
        <p>No schedule exceptions found for this month.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {props.items.map((exception) => (
        <li key={exception.id}>
          <ScheduleExceptionItem
            {...exception}
            onDelete={() => props.onRefresh?.()}
          />
        </li>
      ))}
    </ul>
  );
}

const ScheduleExceptionItem = (
  props: ScheduleException & { onDelete: () => void },
) => {
  const authUser = useAuthUser();
  const { mutate, isProcessing } = useMutation(ScheduleAPIs.exceptions.delete, {
    pathParams: {
      id: props.id,
      facility_id: authUser.home_facility_object!.id!,
    },
  });

  return (
    <div
      className={cn(
        "rounded-lg bg-white py-2 shadow",
        isProcessing && "opacity-50",
      )}
    >
      <div className="flex items-center justify-between py-2 pr-4">
        <div className="flex">
          <ColoredIndicator className="my-1 mr-2.5 h-5 w-1.5 rounded-r" />
          <div className="flex flex-col">
            <span className="space-x-1 text-lg font-semibold">
              <span className="text-gray-700">{props.name}</span>
              <span className="text-gray-500">from</span>
              <span className="text-gray-700">
                {format(parseISO(props.valid_from), "EEE, dd MMM yyyy")}
              </span>
              <span className="text-gray-500">to</span>
              <span className="text-gray-700">
                {format(parseISO(props.valid_to), "EEE, dd MMM yyyy")}
              </span>
            </span>
            <span className="text-sm text-gray-500">{props.name}</span>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={isProcessing}
          onClick={() => {
            toast.promise(mutate(), {
              loading: "Deleting...",
              success: () => {
                props.onDelete();
                return "Exception removed successfully";
              },
              error: "Error",
            });
          }}
        >
          <CareIcon icon="l-minus-circle" className="text-base" />
          <span className="ml-2">Remove</span>
        </Button>
      </div>
      <div className="px-4 py-2">
        <Callout className="mt-2" variant="warning" badge="Warning">
          (TODO: Placeholder; replace this) 3 booked appointments were cancelled
          when you marked this leave. These may need to be rescheduled.
        </Callout>
      </div>
    </div>
  );
};
