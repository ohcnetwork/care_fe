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

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

import { EmptyState } from "./empty-state";

export const DischargeDetails = () => {
  const { t } = useTranslation();
  const { selectedEncounter: encounter, canWriteSelectedEncounter } =
    useEncounter();

  if (!encounter) return <CardListSkeleton count={1} />;

  const dischargeStatus = encounter.status_history.history.find(
    (status) => status.status === "discharged",
  );

  return (
    <div className="bg-gray-100 rounded-md w-full border border-gray-200 p-1 pt-2 space-y-1">
      <div className="flex justify-between items-center pl-2">
        <span className="text-gray-950 font-semibold">
          {t("discharge_details")}
        </span>
        {canWriteSelectedEncounter && (
          <Button variant="ghost" size="sm" asChild>
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
      <div className="bg-white rounded-md p-2 shadow flex flex-col gap-3">
        {dischargeStatus ? (
          <>
            <div className="flex justify-between items-center">
              <div className="flex flex-col text-xs gap-1">
                <span className=" text-gray-700">
                  {t("discharge_date_and_time")}:
                </span>
                <div className="flex flex-row gap-1 font-semibold">
                  <div className="flex flex-row gap-1 font-semibold">
                    <span className="text-gray-950">
                      {format(dischargeStatus.moved_at, "dd MMM yyyy")},
                    </span>
                    <span className="text-gray-700">
                      {format(dischargeStatus.moved_at, "hh:mma")}
                    </span>
                  </div>
                </div>
              </div>
              <Badge variant="green">{t("discharged")}</Badge>
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
          </>
        ) : (
          <EmptyState message={t("not_discharged")} />
        )}
      </div>
    </div>
  );
};
