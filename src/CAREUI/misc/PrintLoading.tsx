import { useTranslation } from "react-i18next";

import { Skeleton } from "@/components/ui/skeleton";

/** The loader for every print preview: a blank page while data loads and the PDF is generated. */
export default function PrintLoading() {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      aria-busy="true"
      className="mx-auto my-4 sm:my-8 flex w-full max-w-4xl flex-col gap-3"
    >
      <div className="aspect-210/297 w-full space-y-6 rounded-md border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-3 w-64" />
        </div>
        <div className="space-y-2 rounded-md border border-gray-200 p-3">
          <Skeleton className="h-8 w-full" />
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-16 w-56" />
        </div>
      </div>
      <p className="text-center text-xs text-gray-500">
        <span className="font-medium text-gray-700">
          {t("preparing_document")}
        </span>{" "}
        {t("preparing_document_hint")}
      </p>
    </div>
  );
}
