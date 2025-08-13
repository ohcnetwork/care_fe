import { NotebookPen } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

export const SummaryPanelReportsTab = () => {
  const { selectedEncounterId } = useEncounter();
  const { t } = useTranslation();

  const reports = [
    {
      label: t("treatment_summary"),
      href: `../${selectedEncounterId}/treatment_summary`,
    },
    {
      label: t("discharge_summary"),
      href: `files?file=discharge_summary&selectedEncounter=${selectedEncounterId}`,
    },
  ] as const satisfies { label: string; href: string }[];

  return (
    <div className="flex flex-col gap-2 bg-gray-100 @sm:bg-white p-2 @sm:p-3 rounded-lg border border-gray-200 @sm:shadow @sm:overflow-x-auto">
      <div className="flex pl-1 @xs:hidden">
        <h6 className="text-gray-950 font-semibold">{t("reports")}</h6>
      </div>
      <div className="flex flex-col sm:@sm:flex-row gap-3 sm:@sm:gap-4">
        {reports.map((report) => (
          <Button
            key={report.label}
            variant="outline"
            className="justify-start sm:@sm:justify-center sm:@sm:flex-1"
            asChild
          >
            <Link href={report.href}>
              <NotebookPen />
              {report.label}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
};
