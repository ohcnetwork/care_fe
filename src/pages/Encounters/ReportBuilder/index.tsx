import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import query from "@/Utils/request/query";
import reportTemplateApi from "@/types/reportTemplate/reportTemplateApi";

interface ReportBuilderSheetProps {
  facilityId: string;
  encounterId: string;
  patientId: string;
  trigger: React.ReactNode;
}

export default function ReportBuilderSheet({
  facilityId,
  encounterId,
  patientId,
  trigger,
}: ReportBuilderSheetProps) {
  const { t } = useTranslation();
  const { data: reportTemplateData } = useQuery({
    queryKey: ["report-templates", facilityId],
    queryFn: query(reportTemplateApi.list, {
      pathParams: {
        facility_external_id: facilityId,
      },
    }),
  });

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{t("available_reports")}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="space-y-2">
            {reportTemplateData?.results?.map((reportTemplate) => (
              <Card
                key={reportTemplate.id}
                className="flex items-center justify-between gap-2 rounded-md bg-gray-100 p-3"
              >
                {reportTemplate.type.toString()}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link
                      href={`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/reportbuilder/${reportTemplate.id}`}
                    >
                      {t("edit_template")}
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link
                      href={`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/reportbuilder/${reportTemplate.id}`}
                    >
                      {t("generate_report")}
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
        <SheetFooter className="mt-4">
          <Button variant="outline" size="sm" asChild>
            <Link
              href={`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/reportbuilder/new`}
            >
              {t("create_new_report")}
            </Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
