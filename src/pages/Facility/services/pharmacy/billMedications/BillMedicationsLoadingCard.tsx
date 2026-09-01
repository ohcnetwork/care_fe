import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

export const BillMedicationsLoadingCard = () => {
  const { t } = useTranslation();

  return (
    <>
      <div className="relative flex justify-between col-start-1 col-span-7 bg-white pt-4 pr-2 pb-2 pl-4">
        <div className="absolute top-5 left-0 h-4 w-1 bg-gray-300 rounded-r-md" />
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-0.5">
            <div className="text-base text-gray-950">
              <Skeleton className="w-20 h-4" />
            </div>
            <div className="flex gap-2.5">
              <Skeleton className="w-20 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Header Row */}
      <div className="col-start-1 bg-gray-100 py-1 px-3 flex items-center">
        <Skeleton className="size-4" />
      </div>
      <div className="bg-gray-100 py-1 px-3 flex items-center">
        <span className="text-sm font-medium text-gray-700">
          {t("medicine")}
        </span>
      </div>
      <div className="bg-gray-100 py-1 pl-3 pr-13 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {t("select_lot")}
        </span>
        <span className="text-sm font-medium text-gray-700">{t("expiry")}</span>
      </div>
      <div className="bg-gray-100 py-1 px-3 flex items-center">
        <span className="text-sm font-medium text-gray-700">
          {t("quantity")}
        </span>
      </div>
      <div className="bg-gray-100 py-1 px-3 flex items-center justify-end">
        <span className="text-sm font-medium text-gray-700">{t("price")}</span>
      </div>
      <div className="bg-gray-100 py-1 px-3 flex items-center">
        <span className="text-sm font-medium text-gray-700">
          {t("all_given_question")}
        </span>
      </div>
      <div className="bg-gray-100 py-1 px-3 flex items-center">
        <span className="text-sm font-medium text-gray-700">
          {t("actions")}
        </span>
      </div>

      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="contents group divide-x divide-gray-200">
          <div className="col-start-1 bg-white group-hover:bg-gray-100 group-focus-within:bg-gray-100 py-1 px-3 flex items-center transition-all duration-200 ease-in-out">
            <Skeleton className="size-4" />
          </div>
          <div className="bg-white py-2 px-3 flex justify-between items-center gap-4">
            <Skeleton className="w-full h-10" />
          </div>
          <div className="bg-white py-2 px-3 flex justify-between items-center gap-4">
            <Skeleton className="w-full h-10" />
          </div>
          <div className="bg-white py-2 px-3 flex justify-between items-center gap-4">
            <Skeleton className="w-full h-10" />
          </div>
          <div className="bg-white py-2 px-3 flex justify-between items-center gap-4">
            <Skeleton className="w-full h-10" />
          </div>
          <div className="bg-white py-2 px-3 flex items-center justify-center">
            <Skeleton className="w-full h-10" />
          </div>
          <div className="bg-white py-1 px-2 flex items-center justify-center">
            <Skeleton className="w-full h-10" />
          </div>
        </div>
      ))}
    </>
  );
};
