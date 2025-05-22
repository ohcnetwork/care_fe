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
      <div className="bg-white rounded border border-gray-200 mb-3">
        <div className="grid grid-cols-12 divide-x">
          <div className="col-span-4 p-2 min-w-[200px] bg-gray-100 break-words whitespace-normal font-bold text-gray-900">
            {symptom.code.display}
          </div>

          <div className="col-span-2 p-2 flex items-center justify-center">
            <Badge
              variant="outline"
              className={`whitespace-nowrap text-sm font-medium ${SYMPTOM_CLINICAL_STATUS_STYLES[symptom.clinical_status]}`}
            >
              {t(symptom.clinical_status)}
            </Badge>
          </div>

          <div className="col-span-2 p-2 flex items-center justify-center">
            <Badge
              variant="outline"
              className={`whitespace-nowrap capitalize text-sm font-medium ${SYMPTOM_VERIFICATION_STATUS_STYLES[symptom.verification_status]}`}
            >
              {t(symptom.verification_status)}
            </Badge>
          </div>

          <div className="col-span-2 p-2 bg-gray-100 flex items-center justify-center truncate text-sm text-gray-800">
            {symptom.onset?.onset_datetime
              ? format(parseISO(symptom.onset.onset_datetime), "dd MMM yyyy")
              : "-"}
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
            </div>
          </div>
        </div>
      </div>

      {showNote && symptom.note && (
        <div className="border border-gray-200 rounded-md p-4 bg-gray-50 relative mb-3 mx-4">
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
        </div>
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
    <div className="max-w-6xl mx-auto mb-4">
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 font-semibold text-gray-700 mb-3">
            <div className="col-span-4">{t("symptom")}</div>
            <div className="col-span-2 text-center">{t("severity")}</div>
            <div className="col-span-2 text-center">{t("status")}</div>
            <div className="col-span-2 text-center">{t("onset")}</div>
            <div className="col-span-2 text-center"></div>
          </div>

          <div>
            {symptoms.map((symptom) => (
              <SymptomRow
                key={symptom.id}
                symptom={symptom}
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
