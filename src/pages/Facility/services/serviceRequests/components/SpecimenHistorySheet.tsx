import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/ui/empty-state";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  ProcessingSpec,
  SPECIMEN_STATUS_COLORS,
  SpecimenRead,
} from "@/types/emr/specimen/specimen";
import { round } from "@/Utils/decimal";

// Processing entries are embedded values without IDs. Count identical signatures
// separately so duplicate events retain unique keys without depending on list order.
function processingEventsWithKeys(processing: ProcessingSpec[]) {
  const occurrences = new Map<string, number>();
  return processing.map((event) => {
    const signature = JSON.stringify([
      event.time_date_time,
      event.performer,
      event.method?.system,
      event.method?.code,
      event.description,
    ]);
    const occurrence = occurrences.get(signature) ?? 0;
    occurrences.set(signature, occurrence + 1);
    return { event, key: `${signature}:${occurrence}` };
  });
}

interface SpecimenHistorySheetProps {
  specimens: SpecimenRead[];
  children: React.ReactNode;
}

export function SpecimenHistorySheet({
  specimens,
  children,
}: SpecimenHistorySheetProps) {
  const { t } = useTranslation();

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{t("specimen_history")}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-6 pr-4">
          <div className="space-y-4">
            {specimens.length === 0 ? (
              <EmptyState
                title={t("no_specimen_history")}
                description={t("specimen_history_empty_description")}
                className="h-64"
              />
            ) : (
              specimens.map((specimen) => (
                <Card key={specimen.id} className="shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">
                        {specimen.specimen_definition?.title}
                      </h3>
                      <Badge
                        variant={SPECIMEN_STATUS_COLORS[specimen.status]}
                        className="capitalize"
                      >
                        {t(specimen.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">{t("specimen_type")}</p>
                        <p>{specimen.specimen_type?.display || "-"}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">{t("collected_at")}</p>
                        <p>
                          {specimen.collection?.collected_date_time
                            ? new Date(
                                specimen.collection.collected_date_time,
                              ).toLocaleString()
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">{t("quantity")}</p>
                        <p>
                          {specimen.collection?.quantity
                            ? `${round(specimen.collection.quantity.value)} ${specimen.collection.quantity.unit.display}`
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">
                          {t("collection_method")}
                        </p>
                        <p>{specimen.collection?.method?.display || "-"}</p>
                      </div>
                    </div>

                    {specimen.processing.length > 0 && (
                      <div className="space-y-2 border-t pt-3">
                        <h4 className="text-sm font-medium">
                          {t("processing")}
                        </h4>
                        <ul className="space-y-2 text-sm">
                          {processingEventsWithKeys(specimen.processing).map(
                            ({ event: processing, key }) => (
                              <li key={key} className="space-y-0.5">
                                <p>
                                  {processing.method?.display ||
                                    processing.description ||
                                    t("method")}
                                </p>
                                {processing.method?.display &&
                                  processing.description !==
                                    processing.method.display && (
                                    <p className="text-gray-500">
                                      {processing.description}
                                    </p>
                                  )}
                                {processing.time_date_time && (
                                  <time
                                    className="block text-gray-500"
                                    dateTime={processing.time_date_time}
                                  >
                                    {format(
                                      new Date(processing.time_date_time),
                                      "MMM d, yyyy, h:mm a",
                                    )}
                                  </time>
                                )}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}

                    {specimen.note && (
                      <div>
                        <p className="text-gray-500">{t("notes")}</p>
                        <p className="text-sm">{specimen.note}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
