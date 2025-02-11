import { useTranslation } from "react-i18next";

import { ScrollArea } from "@/components/ui/scroll-area";
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
        <SheetHeader className="px-1">
          <SheetTitle>{t("location_history")}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
          {history.map((item, index) => (
            <div key={index}>
              <LocationTree
                location={item.location}
                datetime={item.start_datetime}
                isLatest={index === 0}
                showTimeline
              />
            </div>
          ))}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
