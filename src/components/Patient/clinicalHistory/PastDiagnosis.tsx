import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { t } from "i18next";
import { Info, Search } from "lucide-react";
import { navigate } from "raviger";

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import {
  DIAGNOSIS_CLINICAL_STATUS_STYLES,
  DIAGNOSIS_VERIFICATION_STATUS_STYLES,
} from "@/types/emr/diagnosis/diagnosis";
import { Diagnosis } from "@/types/emr/diagnosis/diagnosis";
import diagnosisApi from "@/types/emr/diagnosis/diagnosisApi";

import { TimelineLoading } from "./Util";

type GroupedByYearAndDate = {
  [year: string]: {
    [date: string]: Diagnosis[];
  };
};

const DiagnosisTable = ({
  diagnosis,
  patientId,
  facilityId,
}: {
  diagnosis: Diagnosis[];
  patientId: string;
  facilityId: string;
}) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="overflow-x-auto">
        <Table className="w-full border border-gray-200 min-w-[650px]">
          <TableHeader className="bg-transparent hover:bg-transparent divide-x divide-gray-200 border-b-gray-200">
            <TableRow className="rounded-md overflow-hidden divide-x bg-gray-100">
              <TableHead className="first:rounded-l-md h-auto py-1 px-2 text-gray-600 w-[250px]">
                {t("diagnosis")}
              </TableHead>
              <TableHead className="h-auto text-center py-1 px-2 text-gray-600">
                {t("severity")}
              </TableHead>
              <TableHead className="h-auto text-center py-1 px-2 text-gray-600">
                {t("status")}
              </TableHead>
              <TableHead className="h-auto text-center py-1 px-2 text-gray-600">
                {t("verification")}
              </TableHead>
              <TableHead className="h-auto text-center py-1 px-2 text-gray-600">
                {t("note")}
              </TableHead>
              <TableHead className="h-auto py-1 px-2 text-gray-600"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="space-y-2">
            {diagnosis.map((diagnosis) => (
              <TableRow
                key={diagnosis.id}
                className="bg-transparent hover:bg-transparent divide-x divide-gray-200 border-b-gray-200"
              >
                <TableCell className="max-w-[250px] truncate whitespace-nowrap overflow-hidden font-bold">
                  <div className="truncate" title={diagnosis.code.display}>
                    {diagnosis.code.display}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-center">
                  <Badge
                    variant="outline"
                    className={`whitespace-nowrap ${DIAGNOSIS_CLINICAL_STATUS_STYLES[diagnosis.clinical_status]}`}
                  >
                    {t(diagnosis.clinical_status)}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-center">
                  <Badge
                    variant="outline"
                    className={`whitespace-nowrap capitalize ${
                      DIAGNOSIS_VERIFICATION_STATUS_STYLES[
                        diagnosis.verification_status
                      ]
                    }`}
                  >
                    {t(diagnosis.verification_status)}
                  </Badge>
                </TableCell>
                <TableCell className="truncate whitespace-nowrap overflow-hidden text-center">
                  {diagnosis.onset?.onset_datetime
                    ? format(
                        parseISO(diagnosis.onset.onset_datetime),
                        "dd MMM yyyy",
                      )
                    : "-"}
                </TableCell>
                <TableCell className="text-center">
                  {diagnosis.note ? (
                    <div className="flex justify-center items-center">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs shrink-0"
                          >
                            {t("see_note")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {diagnosis.note}
                          </p>
                        </PopoverContent>
                      </Popover>
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="link">
                        <Info size={18} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() =>
                          navigate(
                            facilityId
                              ? `/facility/${facilityId}/patient/${patientId}/encounter/${diagnosis.encounter}/updates`
                              : `/organization/organizationId/patient/${patientId}/encounter/${diagnosis.encounter}/updates`,
                          )
                        }
                      >
                        {t("view_encounter")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default function DiagnosisTimeline({
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
    queryKey: ["diagnosis", patientId, qParams],
    queryFn: query.paginated(diagnosisApi.listDiagnosis, {
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

  const groupSymptomsByYearAndDate = (
    diagnosis: Diagnosis[] | undefined,
  ): GroupedByYearAndDate => {
    if (!diagnosis) return {};
    return diagnosis.reduce((groups, diagnosis) => {
      if (!diagnosis.created_date) return groups;

      const date = parseISO(diagnosis.created_date);
      const year = format(date, "yyyy");
      const fullDate = format(date, "yyyy-MM-dd");

      if (!groups[year]) {
        groups[year] = {};
      }

      if (!groups[year][fullDate]) {
        groups[year][fullDate] = [];
      }

      groups[year][fullDate].push(diagnosis);
      return groups;
    }, {} as GroupedByYearAndDate);
  };

  const groupedSymptoms = groupSymptomsByYearAndDate(data?.results);
  const sortedYears = Object.keys(groupedSymptoms).sort(
    (a, b) => Number.parseInt(b) - Number.parseInt(a),
  );

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-sky-100 p-2 rounded-md">
          <img src="/images/diagnosis-icon.svg" alt="diagnosis-icon" />
        </div>
        <h1 className="text-2xl font-bold">Past Diagnosis</h1>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="size-5 text-gray-400" />
          </div>
          <Input
            type="search"
            placeholder="Search by diagnosis"
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
            Exclude Entered-in-error
          </Label>
        </div>
      </div>
      {isLoading ? (
        <TimelineLoading />
      ) : sortedYears.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">No diagnosis found</p>
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

                        <div className="ml-3">
                          <DiagnosisTable
                            diagnosis={datesInYear[date]}
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
