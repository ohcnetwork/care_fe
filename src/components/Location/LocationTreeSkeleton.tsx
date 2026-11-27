import { useTranslation } from "react-i18next";

import { Skeleton } from "@/components/ui/skeleton";

const WIDTHS = ["w-40", "w-32", "w-36"];

export function LocationTreeSkeleton() {
  const { t } = useTranslation();
  return (
    <div role="status" className="space-y-1">
      <span className="sr-only">{t("loading")}</span>
      {WIDTHS.map((width) => (
        <div key={width} className="flex min-h-11 items-center gap-2 px-2">
          <Skeleton className="size-4 shrink-0" />
          <Skeleton className={`h-4 ${width}`} />
        </div>
      ))}
    </div>
  );
}
