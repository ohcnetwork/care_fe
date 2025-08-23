import { format } from "date-fns";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { formatName } from "@/Utils/utils";
import { DeviceEncounterHistory } from "@/types/device/device";
import { EncounterRead } from "@/types/emr/encounter/encounter";
import { UserReadMinimal } from "@/types/user/user";

interface EncounterCardProps {
  encounterData: DeviceEncounterHistory;
}

interface EncounterNodeProps {
  encounter: EncounterRead;
  created_by?: UserReadMinimal;
  start: string;
  end: string;
  children?: React.ReactNode;
}

function EncounterNode({
  encounter,
  created_by,
  start,
  end,
  children,
}: EncounterNodeProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center text-sm">
        <span className="size-2 rounded-full bg-gray-400 mr-2" />
        <span className={!end ? "font-semibold" : "text-gray-700 font-medium"}>
          <Link
            href={`/patient/${encounter.patient.id}/encounter/${encounter.id}/updates`}
            basePath={`/facility/${encounter.facility.id}`}
            className="flex gap-1"
          >
            {encounter.patient.name}
            <CareIcon
              icon="l-external-link-alt"
              className="size-3 opacity-50"
            />
          </Link>
        </span>
      </div>
      {created_by && (
        <div className="flex items-center text-sm pl-6">
          <span className="text-gray-700 font-normal">
            {t("associated_by", { name: formatName(created_by) })}
          </span>
        </div>
      )}
      {children}
      {start && (
        <div className="pl-6 flex items-center text-sm font-normal text-gray-700 italic">
          {format(new Date(start), "MMM d, yyyy h:mm a")}
        </div>
      )}
    </div>
  );
}

export const DeviceEncounterCard = ({ encounterData }: EncounterCardProps) => {
  const { start, end, encounter, created_by } = encounterData;

  return (
    <div className={`relative flex gap-8 pl-12 pt-0.5`}>
      <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center">
        <div
          className={`absolute w-px bg-gray-200 h-full ${!end ? "top-3" : "-top-3"}`}
        />
        <div
          className={`size-6 rounded-full ${!end ? "bg-green-100" : "bg-gray-100"} flex items-center justify-center z-10`}
        >
          <CareIcon
            icon={!end ? "l-location-point" : "l-check"}
            className={`size-4 ${!end ? "text-green-600" : "text-gray-600"}`}
          />
        </div>
        {!end && <div className="flex-1 w-px bg-gray-200" />}
      </div>
      <div className="flex flex-col gap-2">
        <EncounterNode
          encounter={encounter}
          start={start}
          end={end}
          created_by={created_by}
        />
      </div>
    </div>
  );
};
