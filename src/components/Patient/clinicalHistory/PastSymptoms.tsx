import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { TFunction, t } from "i18next";
import { Info, Search, X } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
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

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import {
  SYMPTOM_CLINICAL_STATUS_STYLES,
  SYMPTOM_VERIFICATION_STATUS_STYLES,
  Symptom,
} from "@/types/emr/symptom/symptom";
import symptomApi from "@/types/emr/symptom/symptomApi";

import { TimelineLoading, groupByYearAndDate } from "./Util";

const SymptomRow = ({
  symptom,
  patientId,
  facilityId,
  t,
}: {
  symptom: Symptom;
  patientId: string;
  facilityId: string;
  t: TFunction;
}) => {
  const [showNote, setShowNote] = useState(false);

  return (
    <>
      <TableRow>
        <TableCell className="px-4 py-4 w-[30%] max-w-[300px] font-bold text-left break-words whitespace-normal border border-gray-200 rounded-md bg-white">
          {symptom.code.display}
        </TableCell>
        <TableCell className="px-4 py-4 w-[14%] text-center border border-gray-200 rounded-md bg-white">
          <Badge
            variant="outline"
            className={`whitespace-nowrap ${SYMPTOM_CLINICAL_STATUS_STYLES[symptom.clinical_status]}`}
          >
            {t(symptom.clinical_status)}
          </Badge>
        </TableCell>
        <TableCell className="px-4 py-4 w-[14%] text-center border border-gray-200 rounded-md bg-white">
          <Badge
            variant="outline"
            className={`whitespace-nowrap capitalize ${SYMPTOM_VERIFICATION_STATUS_STYLES[symptom.verification_status]}`}
          >
            {t(symptom.verification_status)}
          </Badge>
        </TableCell>
        <TableCell className="truncate px-4 py-4 w-[14%] text-center border border-gray-200 rounded-md bg-white">
          {symptom.onset?.onset_datetime
            ? format(parseISO(symptom.onset.onset_datetime), "dd MMM yyyy")
            : "-"}
        </TableCell>

        <TableCell className="px-4 py-4 w-[14%] text-center border border-gray-200 rounded-md bg-white">
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
                    name={symptom.created_by.username}
                    className="size-4"
                    imageUrl={symptom.created_by.profile_picture_url}
                  />

                  <span className="text-sm">
                    {formatName(symptom.created_by)}
                  </span>
                </div>
              </div>
              <DropdownMenuItem
                onClick={() =>
                  navigate(
                    facilityId
                      ? `/facility/${facilityId}/patient/${patientId}/encounter/${symptom.encounter}/updates`
                      : `/organization/organizationId/patient/${patientId}/encounter/${symptom.encounter}/updates`,
                  )
                }
              >
                {t("view_encounter")}
              </DropdownMenuItem>
              {symptom.note && (
                <DropdownMenuItem onClick={() => setShowNote(!showNote)}>
                  {showNote ? t("hide_note") : t("see_note")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {showNote && symptom.note && (
        <tr>
          <td
            colSpan={6}
            className="border border-gray-200 rounded-md p-4 bg-gray-50 relative"
          >
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 size-6 p-0"
              onClick={() => setShowNote(false)}
            >
              <X size={16} />
              <span className="sr-only">{t("close")}</span>
            </Button>
            <p className="text-sm text-gray-700 whitespace-pre-wrap pr-8">
              {symptom.note}
            </p>
          </td>
        </tr>
      )}
    </>
  );
};

export const SymptomTable = ({
  symptoms,
  patientId,
  facilityId,
}: {
  symptoms: Symptom[];
  patientId: string;
  facilityId: string;
}) => {
  const { t } = useTranslation();

  return (
    <div className="border-0 mb-3">
      <Table className="w-full border-separate border-spacing-2">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[45%] max-w-[300px] px-4 py-3 text-left text-gray-600 truncate border border-gray-200 rounded-md bg-gray-100">
              {t("symptom")}
            </TableHead>
            <TableHead className="w-[14%] px-4 py-3 text-center text-gray-600 border border-gray-200 rounded-md bg-gray-100">
              {t("severity")}
            </TableHead>
            <TableHead className="w-[14%] px-4 py-3 text-center text-gray-600 border border-gray-200 rounded-md bg-gray-100">
              {t("status")}
            </TableHead>
            <TableHead className="w-[14%] px-4 py-3 text-center text-gray-600 border border-gray-200 rounded-md bg-gray-100">
              {t("onset")}
            </TableHead>
            <TableHead className="w-[14%] px-4 py-3 text-center text-gray-600 border border-gray-200 rounded-md bg-gray-100"></TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {symptoms.map((symptom) => (
            <SymptomRow
              key={symptom.id}
              symptom={symptom}
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

export default function SymptomsTimeline({
  patientId,
  facilityId,
}: {
  patientId: string;
  facilityId: string;
}) {
  const { qParams, updateQuery } = useFilters({
    disableCache: true,
  });
  const { data, isLoading } = useQuery({
    queryKey: ["symptoms", patientId, qParams],
    queryFn: query.paginated(symptomApi.listSymptoms, {
      pathParams: { patientId },
      pageSize: 100,
      queryParams: {
        name: qParams.name,
        exclude_verification_status: qParams.exclude_entered_in_error
          ? "entered_in_error"
          : undefined,
      },
    }),
    enabled: !!patientId,
  });

  const groupedSymptoms = groupByYearAndDate(
    data?.results,
    (s) => s.created_date,
  );
  const sortedYears = Object.keys(groupedSymptoms).sort(
    (a, b) => Number.parseInt(b) - Number.parseInt(a),
  );

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-sky-100 p-2 rounded-md">
          <img src="/images/symptoms-icon.svg" alt="symptoms-icon" />
        </div>
        <h1 className="text-2xl font-bold">{t("past_symptoms")}</h1>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="size-5 text-gray-400" />
          </div>
          <Input
            type="search"
            placeholder={t("search_by_symptoms")}
            className="pl-10 h-10 border-gray-300"
            value={qParams.name}
            onChange={(e) => updateQuery({ name: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={qParams.exclude_entered_in_error ?? false}
            onCheckedChange={(val) =>
              updateQuery({ exclude_entered_in_error: val })
            }
            id="exclude-entered-in-error"
          />
          <Label htmlFor="exclude-entered-in-error">
            {t("exclude_entered_in_error")}
          </Label>
        </div>
      </div>
      {isLoading ? (
        <TimelineLoading />
      ) : sortedYears.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">{t("no_symptoms_description")}</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[11px] top-0 bottom-0 w-[1px] bg-gray-300"></div>

          <div className="space-y-8">
            {sortedYears.map((year) => {
              const datesInYear = groupedSymptoms[year];
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
                            <div className="size-4 rounded-full bg-sky-500 border border-black" />
                          </div>
                          <div className="font-medium text-indigo-700 ml-3">
                            {format(new Date(date), "dd MMMM, yyyy")}
                          </div>
                        </div>

                        <div className="ml-3 bg-gray-50 rounded-lg p-4 overflow-x-auto">
                          <SymptomTable
                            symptoms={datesInYear[date]}
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
