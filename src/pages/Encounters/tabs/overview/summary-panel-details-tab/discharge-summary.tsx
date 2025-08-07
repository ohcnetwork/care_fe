import { format } from "date-fns";
import { SquarePen } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import { EncounterRead } from "@/types/emr/encounter/encounter";

export const DischargeDetails = ({
  encounter,
}: {
  encounter: EncounterRead;
}) => {
  const { t } = useTranslation();

  return (
    <div className="p-1">
      <div className="flex justify-between items-center p-2">
        <span className="text-gray-950 font-semibold">
          {t("discharge_details")}
        </span>
        <SquarePen
          className="size-4 cursor-pointer text-gray-950"
          strokeWidth={1.5}
        />
      </div>
      <div className="bg-white rounded-md p-2 shadow flex flex-col">
        <div className="flex justify-between items-center">
          <div className="flex flex-col text-xs gap-1">
            <span className=" text-gray-700">
              {t("discharge_date_and_time")}:
            </span>
            {encounter.period.end ? (
              <div className="flex flex-row gap-1 font-semibold">
                <span className="text-gray-950">
                  {format(encounter.period.end, "dd MMM yyyy")},
                </span>
                <span className="text-gray-700">
                  {format(encounter.period.end, "hh:mma")}
                </span>
              </div>
            ) : (
              <span className="text-gray-950">--({t("ongoing")})</span>
            )}
          </div>
          {encounter.period.end && (
            <Badge variant="green">{t("discharged")}</Badge>
          )}
        </div>
      </div>
    </div>
  );
};
