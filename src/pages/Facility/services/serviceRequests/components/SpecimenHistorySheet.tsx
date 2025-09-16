import { useTranslation } from "react-i18next";

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
  SPECIMEN_STATUS_COLORS,
  SpecimenRead,
} from "@/types/emr/specimen/specimen";

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
            {specimens.map((specimen) => (
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
                          ? `${specimen.collection.quantity.value} ${specimen.collection.quantity.unit.display}`
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">{t("collection_method")}</p>
                      <p>{specimen.collection?.method?.display || "-"}</p>
                    </div>
                  </div>

                  {specimen.note && (
                    <div>
                      <p className="text-gray-500">{t("notes")}</p>
                      <p className="text-sm">{specimen.note}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
