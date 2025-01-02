import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { format, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";

import ColoredIndicator from "@/CAREUI/display/ColoredIndicator";
import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Loading from "@/components/Common/Loading";
import {
  getDaysOfWeekFromAvailabilities,
  getSlotsPerSession,
} from "@/components/Schedule/helpers";
import {
  ScheduleSlotTypes,
  ScheduleTemplate,
} from "@/components/Schedule/types";
import { formatAvailabilityTime } from "@/components/Users/UserAvailabilityTab";

interface Props {
  items?: ScheduleTemplate[];
}

export default function ScheduleTemplatesList({ items }: Props) {
  if (items == null) {
    return <Loading />;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center text-center text-gray-500 py-64">
        <CareIcon icon="l-calendar-slash" className="size-10 mb-3" />
        <p>No schedule templates found for this month.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {items.map((template) => (
        <li key={template.id}>
          <ScheduleTemplateItem {...template} />
        </li>
      ))}
    </ul>
  );
}

const ScheduleTemplateItem = (props: ScheduleTemplate) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg bg-white py-2 shadow">
      <div className="flex items-center justify-between py-2 pr-4">
        <div className="flex">
          <ColoredIndicator
            className="my-1 mr-2.5 h-5 w-1.5 rounded-r"
            id={props.id}
          />
          <div className="flex flex-col">
            <span className="text-lg font-semibold">{props.name}</span>
            <span className="text-sm text-gray-700">
              Scheduled for{" "}
              <strong className="font-medium">
                {getDaysOfWeekFromAvailabilities(props.availabilities)
                  .map((day) => t(`DAYS_OF_WEEK_SHORT__${day}`))
                  .join(", ")}
              </strong>
            </span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <DotsHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-col gap-2 px-4 py-2">
        <ul className="flex flex-col gap-2">
          {props.availabilities.map((slot) => (
            <li key={slot.id} className="w-full">
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <div className="flex w-full items-center justify-between">
                  <div className="flex flex-col">
                    <span>{slot.name}</span>
                    <p className="text-gray-600">
                      <span className="text-sm">
                        {/* TODO: Temp. hack since backend is giving slot_type as number in Response */}
                        {
                          ScheduleSlotTypes[
                            (slot.slot_type as unknown as number) - 1
                          ]
                        }
                      </span>
                      <span className="px-2 text-gray-300">|</span>
                      <span className="text-sm">
                        {Math.floor(
                          getSlotsPerSession(
                            slot.availability[0].start_time,
                            slot.availability[0].end_time,
                            slot.slot_size_in_minutes,
                          ) ?? 0,
                        )}{" "}
                        slots of {slot.slot_size_in_minutes} mins.
                      </span>
                    </p>
                  </div>
                  <span className="text-sm">
                    {formatAvailabilityTime(slot.availability)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <span className="text-sm text-gray-500">
          Valid from{" "}
          <strong className="font-semibold">
            {format(parseISO(props.valid_from), "EEE, dd MMM yyyy")}
          </strong>{" "}
          till{" "}
          <strong className="font-semibold">
            {format(parseISO(props.valid_to), "EEE, dd MMM yyyy")}
          </strong>
        </span>
      </div>
    </div>
  );
};
