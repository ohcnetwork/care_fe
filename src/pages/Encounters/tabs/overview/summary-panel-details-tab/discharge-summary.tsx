import { format } from "date-fns";
import { NotepadText, SquarePen } from "lucide-react";
import { Link, useFullPath } from "raviger";
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

import { SummaryPanelEmptyState as EmptyState } from "./empty-state";

interface DischargeDetailsProps {
  title?: string;
}

export const DischargeDetails = ({ title }: DischargeDetailsProps = {}) => {
  const { t } = useTranslation();
  const returnPage = useFullPath().split("/").pop() ?? "updates";
  const { selectedEncounter: encounter, canWriteSelectedEncounter } =
    useEncounter();

  if (!encounter) return <CardListSkeleton count={1} />;

  const dischargeStatus = encounter.status_history.history.find(
    (status) => status.status === "discharged",
  );

  return (
    <section
      aria-label={title ?? t("discharge_details")}
      className="min-w-0 w-full rounded-xl border border-gray-200 bg-white"
    >
      <div className="flex min-h-11 items-center justify-between gap-2 border-b border-gray-200 px-3 py-1">
        <span className="min-w-0 [overflow-wrap:anywhere] text-sm font-bold uppercase tracking-wide text-gray-600">
          {title ?? t("discharge_details")}
        </span>
        {canWriteSelectedEncounter && (
          <Button variant="ghost" size="sm" className="shrink-0" asChild>
            <Link
              href={`/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/questionnaire/encounter?${new URLSearchParams({ return_page: returnPage })}`}
              aria-label={t("edit")}
            >
              <SquarePen
                className="size-4 text-gray-950 cursor-pointer"
                strokeWidth={1.5}
              />
            </Link>
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-3 p-3">
        {dischargeStatus ? (
          <>
            <div className="flex flex-wrap justify-between items-center gap-2">
              {encounter.period.end && (
                <div className="flex flex-col text-xs gap-1">
                  <span className="text-gray-700">
                    {t("discharge_date_and_time")}:
                  </span>

                  <div className="flex flex-wrap gap-1 font-semibold">
                    <span className="text-gray-950">
                      {format(encounter.period.end, "dd MMM yyyy")},
                    </span>
                    <span className="text-gray-700">
                      {format(encounter.period.end, "hh:mma")}
                    </span>
                  </div>
                </div>
              )}
              <Badge variant="green">{t("discharged")}</Badge>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-sm p-2 gap-1 cursor-pointer"
                >
                  <div className="bg-white border border-gray-200 rounded-md size-8 flex items-center justify-center">
                    <NotepadText className="text-gray-500 size-4" />
                  </div>
                  <span className="max-w-full font-semibold text-sm text-gray-950 underline [overflow-wrap:anywhere]">
                    {t("discharge_summary_advice")}
                  </span>
                </button>
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
    </section>
  );
};
