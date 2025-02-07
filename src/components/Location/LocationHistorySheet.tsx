import { useTranslation } from "react-i18next";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { LocationHistory } from "@/types/emr/encounter";

import { LocationTree } from "./LocationTree";

interface LocationHistorySheetProps {
  trigger: React.ReactNode;
  history: LocationHistory[];
}

export function LocationHistorySheet({
  trigger,
  history,
}: LocationHistorySheetProps) {
  const { t } = useTranslation();

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{t("location_history")}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {history.map((item, index) => (
            <div key={index}>
              <LocationTree
                location={item.location}
                datetime={item.start_datetime}
                isLatest={index === 0}
              />
              {index !== history.length - 1 && (
                <div className="border-b border-dashed border-gray-200 mt-4" />
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
