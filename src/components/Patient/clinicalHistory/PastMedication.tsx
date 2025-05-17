import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Info, Search, X } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Avatar } from "@/components/Common/Avatar";
import { getFrequencyDisplay } from "@/components/Medicine/MedicationsTable";
import { formatDosage, formatSig } from "@/components/Medicine/utils";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
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

  const combinedInstruction = `${remarks || "-"}${
    notes ? ` (${t("note")}: ${notes})` : ""
  }`;

  const frequencyDisplay = instruction?.as_needed_boolean
    ? `${t("as_needed_prn")} (${instruction?.as_needed_for?.display ?? "-"})`
    : [
        frequency?.meaning ?? "-",
        ...(instruction?.additional_instruction?.map((inst) => inst.display) ||
          []),
      ].join(", ");

  return (
    <>
      <TableRow className="bg-white hover:bg-gray-50 divide-x divide-gray-200">
        <TableCell className="truncate px-4 py-4 w-[30%] max-w-[300px] font-bold text-left">
          {medicine.medication?.display}
        </TableCell>

        <TableCell className="px-4 py-4 w-[14%] text-center">
          {dosage || "-"}
        </TableCell>

        <TableCell className="px-4 py-4 w-[14%] text-center">
          {frequencyDisplay}
        </TableCell>

        <TableCell className="px-4 py-4 w-[14%] text-center">
          {duration ? `${duration.value} ${duration.unit}` : "-"}
        </TableCell>

        <TableCell className="px-4 py-4 w-[14%] text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="link">
                <Info size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <div className="px-3 py-2 text-sm text-gray-500 border-b">
                <div className="font-medium text-gray-700">
                  {t("reported_by")}
                </div>
                <div className="flex items-center gap-2">
                  <Avatar
                    name={medicine.created_by?.username}
                    className="size-4"
                    imageUrl={medicine.created_by.read_profile_picture_url}
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
              {combinedInstruction && (
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
        </TableCell>
      </TableRow>

      {showInstruction && combinedInstruction && (
        <tr>
          <td
            colSpan={6}
            className="border border-gray-200 border-t-0 rounded-b-lg p-4 bg-gray-50 relative"
          >
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
          </td>
        </tr>
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
    <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
      <Table className="w-full">
        <TableHeader className="bg-gray-100 divide-x divide-gray-200">
          <TableRow className="divide-x divide-gray-200">
            <TableHead className="w-[45%] max-w-[300px] px-4 py-3 text-left text-gray-600 truncate">
              {t("medicine")}
            </TableHead>
            <TableHead className="w-[14%] px-4 py-3 text-center text-gray-600">
              {t("dosage")}
            </TableHead>
            <TableHead className="w-[14%] px-4 py-3 text-center text-gray-600">
              {t("frequency")}
            </TableHead>
            <TableHead className="w-[14%] px-4 py-3 text-center text-gray-600">
              {t("duration")}
            </TableHead>

            <TableHead className="w-[14%] px-4 py-3 text-center text-gray-600"></TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {medicines.map((medicine) => (
            <MedicineRow
              key={medicine.id}
              medicine={medicine}
              patientId={patientId}
              facilityId={facilityId}
              t={t}
            />
          ))}
        </TableBody>
      </Table>
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

  const { data, isLoading } = useQuery({
    queryKey: ["medication", patientId, qParams],
    queryFn: query.paginated(medicationRequestApi.list, {
      pathParams: { patientId },
      pageSize: 100,
      queryParams: {
        name: qParams.name,
        status: qParams.exclude_inactive
          ? ACTIVE_MEDICATION_STATUSES.join(",")
          : undefined,
      },
    }),
    enabled: !!patientId,
  });

  const groupedMedicines = groupByYearAndDate(
    data?.results,
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
    </div>
  );
}
