import { useTranslation } from "react-i18next";

import { Skeleton } from "@/components/ui/skeleton";

export default function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="w-full rounded-lg bg-muted/50 py-5 flex flex-col items-center justify-center text-center space-y-4 bg-gray-100">
      <div className="bg-white shadow-sm rounded-lg p-4 grid grid-cols-2 gap-2 w-40">
        {/* Left column */}
        <Skeleton className="h-3 w-full rounded-md" />
        <Skeleton className="h-3 w-full rounded-md" />
        <Skeleton className="h-3 w-full rounded-md" />

        {/* Right column */}
        <Skeleton className="h-3 w-full rounded-md" />
        <Skeleton className="h-3 w-full rounded-md" />
        <Skeleton className="h-3 w-full rounded-md" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{t(title)}</h3>
        <p className="text-sm text-gray-600">{t(description)}</p>
      </div>
    </div>
  );
}
