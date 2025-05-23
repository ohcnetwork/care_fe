import { useInfiniteQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Info, Search, X } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { Avatar } from "@/components/Common/Avatar";
import { getFrequencyDisplay } from "@/components/Medicine/MedicationsTable";
import { formatDosage, formatSig } from "@/components/Medicine/utils";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { formatName } from "@/Utils/utils";
import {
  ACTIVE_MEDICATION_STATUSES,
  MedicationRequestRead,
} from "@/types/emr/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";

import { TimelineLoading, groupByYearAndDate } from "./Util";

const MedicineRow = ({
  medicine,
  patientId,
  facilityId,
  t,
}: {
  medicine: MedicationRequestRead;
  patientId: string;
  facilityId: string;
  t: (key: string) => string;
}) => {
  const [showInstruction, setShowInstruction] = useState(false);

  const instruction = medicine.dosage_instruction?.[0];
  const frequency = getFrequencyDisplay(instruction?.timing);
  const dosage = formatDosage(instruction);
  const duration = instruction?.timing?.repeat?.bounds_duration;
  const remarks = formatSig(instruction);
  const notes = medicine.note;

  const combinedInstruction = `${remarks || "-"}${notes ? ` (${t("note")}: ${notes})` : ""}`;

  const frequencyDisplay = instruction?.as_needed_boolean
    ? `${t("as_needed_prn")} (${instruction?.as_needed_for?.display ?? "-"})`
    : [
        frequency?.meaning ?? "-",
        ...(instruction?.additional_instruction?.map((inst) => inst.display) ||
          []),
      ].join(", ");

  return (
    <>
      <div className="bg-white rounded border border-gray-200">
        <div className="grid grid-cols-12 divide-x">
          <div className="col-span-4 p-2 min-w-[200px] bg-gray-100 break-words whitespace-normal font-bold text-gray-900">
            {medicine.medication?.display}
          </div>

          <div className="col-span-2 p-2 flex items-center justify-center text-sm text-gray-800">
            {dosage || "-"}
          </div>

          <div className="col-span-2 p-2 flex items-center justify-center text-sm text-gray-800 whitespace-pre-wrap break-words text-center">
            {frequencyDisplay || "-"}
          </div>

          <div className="col-span-2 p-2 bg-gray-100 flex items-center justify-center text-sm text-gray-800 truncate">
            {duration ? `${duration.value} ${duration.unit}` : "-"}
          </div>

          <div className="col-span-2 flex justify-between">
            <div className="flex-1 flex items-center justify-center p-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="link"
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Info size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <div className="px-3 py-2 text-sm text-gray-500 border-b">
                    <div className="font-medium text-gray-700">
                      {t("reported_by")}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar
                        name={medicine.created_by?.username}
                        className="size-4"
                        imageUrl={medicine.created_by?.read_profile_picture_url}
                      />
                      <span className="text-sm">
                        {formatName(medicine.created_by)}
                      </span>
                    </div>
                  </div>
                  <DropdownMenuItem
                    onClick={() =>
                      navigate(
                        facilityId
                          ? `/facility/${facilityId}/patient/${patientId}/encounter/${medicine.encounter}/updates`
                          : `/organization/organizationId/patient/${patientId}/encounter/${medicine.encounter}/updates`,
                      )
                    }
                  >
                    {t("view_encounter")}
                  </DropdownMenuItem>
                  {combinedInstruction && combinedInstruction !== "-" && (
                    <DropdownMenuItem
                      onClick={() => setShowInstruction(!showInstruction)}
                    >
                      {showInstruction
                        ? t("hide_instruction")
                        : t("see_instruction")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {showInstruction && combinedInstruction && (
        <div className="border border-gray-200 rounded-md p-4 bg-gray-50 relative mb-3 mx-4">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 size-6 p-0"
            onClick={() => setShowInstruction(false)}
          >
            <X size={16} />
            <span className="sr-only">{t("close")}</span>
          </Button>
          <p className="text-sm text-gray-700 whitespace-pre-wrap pr-8">
            {combinedInstruction}
          </p>
        </div>
      )}
    </>
  );
};

export const MedicationTable = ({
  medicines,
  patientId,
  facilityId,
}: {
  medicines: MedicationRequestRead[];
  patientId: string;
  facilityId: string;
}) => {
  const { t } = useTranslation();

  return (
    <div className="max-w-6xl mx-auto mb-4">
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 font-semibold text-gray-700 mb-3">
            <div className="col-span-4">{t("medicine")}</div>
            <div className="col-span-2 text-center">{t("dosage")}</div>
            <div className="col-span-2 text-center">{t("frequency")}</div>
            <div className="col-span-2 text-center">{t("duration")}</div>
            <div className="col-span-2 text-center"></div>
          </div>

          <div>
            {medicines.map((medicine) => (
              <MedicineRow
                key={medicine.id}
                medicine={medicine}
                patientId={patientId}
                facilityId={facilityId}
                t={t}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MedicationTimeline({
  patientId,
  facilityId,
}: {
  patientId: string;
  facilityId: string;
}) {
  const { t } = useTranslation();
  const { qParams, updateQuery } = useFilters({
    disableCache: true,
  });

  // just did it for testing , what should be the limit ?
  const LIMIT = 2;

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: [
        "medication",
        patientId,
        qParams.name,
        qParams.exclude_inactive,
      ],
      queryFn: async ({ pageParam = 0 }) => {
        const response = await query(medicationRequestApi.list, {
          pathParams: { patientId },
          queryParams: {
            name: qParams.name,
            status: qParams.exclude_inactive
              ? ACTIVE_MEDICATION_STATUSES.join(",")
              : undefined,
            limit: String(LIMIT),
            offset: String(pageParam),
            ordering: "-created_date",
          },
        })({ signal: new AbortController().signal });

        return response as PaginatedResponse<MedicationRequestRead>;
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        const currentOffset = allPages.length * LIMIT;
        return currentOffset < lastPage.count ? currentOffset : null;
      },
      enabled: !!patientId,
    });

  const medicationList = data?.pages.flatMap((p) => p.results) || [];

  const groupedMedicines = groupByYearAndDate(
    medicationList,
    (m) => m.created_date,
  );
  const sortedYears = Object.keys(groupedMedicines).sort(
    (a, b) => Number.parseInt(b) - Number.parseInt(a),
  );

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-pink-100 p-2 rounded-md">
          <img src="/images/medicines-icon.svg" alt="medicines-icon" />
        </div>
        <h1 className="text-2xl font-bold">{t("past_medication")}</h1>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="size-5 text-gray-400" />
          </div>
          <Input
            type="search"
            placeholder={t("search_by_medicine")}
            className="pl-10 h-10 border-gray-300"
            value={qParams.name}
            onChange={(e) => updateQuery({ name: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={qParams.exclude_inactive ?? false}
            onCheckedChange={(val) => updateQuery({ exclude_inactive: val })}
            id="exclude-inactive"
          />
          <Label htmlFor="exclude-inactive">{t("exclude_inactive")}</Label>
        </div>
      </div>
      {isLoading ? (
        <TimelineLoading />
      ) : sortedYears.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">{t("no_medications_description")}</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[11px] top-0 bottom-0 w-[1px] bg-gray-300"></div>

          <div className="space-y-8">
            {sortedYears.map((year) => {
              const datesInYear = groupedMedicines[year];
              const sortedDates = Object.keys(datesInYear).sort(
                (a, b) => new Date(b).getTime() - new Date(a).getTime(),
              );

              return (
                <div key={year} className="relative">
                  <div className="flex items-center mb-6">
                    <div className="bg-gray-50 z-10 text-lg text-indigo-700 font-medium border-t-2 border-b-2 border-gray px-3">
                      {year}
                    </div>
                  </div>

                  <div className="space-y-8 ml-[12px]">
                    {sortedDates.map((date) => (
                      <div key={date} className="relative">
                        <div className="flex items-center mb-3">
                          <div className="absolute left-[-8px] z-10">
                            <div className="size-4 rounded-full bg-pink-300 border border-black" />
                          </div>
                          <div className="font-medium text-indigo-700 ml-3">
                            {format(new Date(date), "dd MMMM, yyyy")}
                          </div>
                        </div>

                        <div className="ml-3 bg-gray-50 rounded-lg p-4 overflow-x-auto">
                          <MedicationTable
                            medicines={datesInYear[date]}
                            patientId={patientId}
                            facilityId={facilityId}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {hasNextPage && (
        <Button
          variant="link"
          className={cn(
            "text-md -ml-4 font-extrabold  w-fit",
            isFetchingNextPage && "pointer-events-none hover:no-underline",
          )}
          // Should I go with  disable or is it fine pointer-event-none
          onClick={() => fetchNextPage()}
        >
          {isFetchingNextPage ? t("loading") : t("load_more")}...
        </Button>
      )}
    </div>
  );
}
