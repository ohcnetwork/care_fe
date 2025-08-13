import { format } from "date-fns";
import { NotepadText, SquarePen } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

export const DischargeDetails = () => {
  const { t } = useTranslation();
  const { selectedEncounter: encounter, canWriteSelectedEncounter } =
    useEncounter();

  if (!encounter) return null;

  return (
    <div className="bg-gray-100 rounded-md w-full border border-gray-200 pt-2">
      <div className="flex justify-between items-center p-2 pl-3 pr-1">
        <span className="text-gray-950 font-semibold">
          {t("discharge_details")}
        </span>
        {canWriteSelectedEncounter && (
          <Button variant="ghost" size="xs" asChild>
            <Link
              href={`/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/questionnaire/encounter`}
            >
              <SquarePen
                className="size-4 text-gray-950 cursor-pointer"
                strokeWidth={1.5}
              />
            </Link>
          </Button>
        )}
      </div>
      <div className="bg-white rounded-md p-2 shadow flex flex-col gap-3 mx-1 mb-1">
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
        <Dialog>
          <DialogTrigger asChild>
            <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-sm p-2 gap-1 cursor-pointer">
              <div className="bg-white border border-gray-200 rounded-md size-8 flex items-center justify-center">
                <NotepadText className="text-gray-500 size-4" />
              </div>
              <span className="font-semibold text-sm text-gray-950 underline">
                {t("discharge_summary_advice")}
              </span>
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("discharge_summary_advice")}</DialogTitle>
            </DialogHeader>
            <div className="w-full h-35 border-gray-200 border rounded-md p-2 overflow-y-auto">
              {encounter.discharge_summary_advice ? (
                encounter.discharge_summary_advice
                  .split("\n")
                  .map((paragraph, index) => (
                    <p
                      key={index}
                      className="text-sm text-gray-950 text-justify"
                    >
                      {paragraph}
                    </p>
                  ))
              ) : (
                <span className="text-gray-600 text-sm">
                  {t("no_discharge_summary_advice")}
                </span>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
