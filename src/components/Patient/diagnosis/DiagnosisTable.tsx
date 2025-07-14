import { Info, X } from "lucide-react";
import { navigate, usePathParams } from "raviger";
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

import { Avatar } from "@/components/Common/Avatar";
import RelativeDateTooltip from "@/components/Common/RelativeDateTooltip";

import { useIsMobile } from "@/hooks/use-mobile";

import { formatName } from "@/Utils/utils";
import {
  DIAGNOSIS_CLINICAL_STATUS_COLORS,
  DIAGNOSIS_VERIFICATION_STATUS_COLORS,
  type Diagnosis,
} from "@/types/emr/diagnosis/diagnosis";

const DiagnosisRow = ({
  diagnosis,
  patientId,
  facilityId,
}: {
  diagnosis: Diagnosis;
  patientId: string;
  facilityId?: string;
}) => {
  const [showNote, setShowNote] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded border border-gray-200 mb-3">
      <div className="grid grid-cols-13 divide-x">
        <div className="col-span-6 px-2 py-1 bg-gray-100 break-words whitespace-normal text-base font-semibold text-gray-900">
          {diagnosis.code.display}
        </div>
        <div className="col-span-2 flex items-center justify-center">
          <Badge
            variant={
              DIAGNOSIS_CLINICAL_STATUS_COLORS[diagnosis.clinical_status]
            }
            className="whitespace-nowrap text-sm"
          >
            {t(diagnosis.clinical_status)}
          </Badge>
        </div>
        <div className="col-span-2 flex items-center justify-center">
          <Badge
            variant={
              DIAGNOSIS_VERIFICATION_STATUS_COLORS[
                diagnosis.verification_status
              ]
            }
            className="whitespace-nowrap text-sm"
          >
            {t(diagnosis.verification_status)}
          </Badge>
        </div>
        <div className="col-span-2 bg-gray-100 flex items-center justify-center">
          {diagnosis.onset?.onset_datetime ? (
            <RelativeDateTooltip date={diagnosis.onset.onset_datetime} />
          ) : (
            "-"
          )}
        </div>
        <div className="col-span-1 flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="link"
                className="text-gray-500 hover:text-gray-700"
              >
                <Info size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <div className="px-3 py-2 text-sm text-gray-500 border-b">
                <div className="font-medium text-gray-700">
                  {t("reported_by")}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar
                    name={formatName(diagnosis.created_by)}
                    className="size-5"
                    imageUrl={diagnosis.created_by.profile_picture_url}
                  />
                  <span className="text-sm">
                    {formatName(diagnosis.created_by)}
                  </span>
                </div>
              </div>
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
              {diagnosis.note && (
                <DropdownMenuItem onClick={() => setShowNote(!showNote)}>
                  {showNote ? t("hide_note") : t("see_note")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {showNote && diagnosis.note && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex flex-row w-full justify-between">
            <div className="text-sm font-semibold text-gray-800">
              {t("note")} :
            </div>
            <Button
              variant="ghost"
              className="size-6 p-0"
              onClick={() => setShowNote(false)}
            >
              <X size={14} />
              <span className="sr-only">{t("close")}</span>
            </Button>
          </div>

          <p className="text-sm text-gray-700 whitespace-pre-wrap pr-8 max-w-full break-words break-all">
            {diagnosis.note}
          </p>
        </div>
      )}
    </div>
  );
};

const DiagnosisCard = ({
  diagnosis,
  patientId,
  facilityId,
}: {
  diagnosis: Diagnosis;
  patientId: string;
  facilityId?: string;
}) => {
  const [showNote, setShowNote] = useState(false);
  const { t } = useTranslation();
  return (
    <div className="border rounded-md p-4 bg-white">
      <div className="flex justify-between items-start flex-wrap gap-2">
        <div className="flex-1 font-semibold text-gray-900 break-words">
          {diagnosis.code.display}
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={
              DIAGNOSIS_CLINICAL_STATUS_COLORS[diagnosis.clinical_status]
            }
            className="whitespace-nowrap"
          >
            {t(diagnosis.clinical_status)}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="link"
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <Info size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <div className="px-3 py-2 text-sm text-gray-500 border-b">
                <div className="font-medium text-gray-700">
                  {t("reported_by")}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar
                    name={formatName(diagnosis.created_by)}
                    className="size-5"
                    imageUrl={diagnosis.created_by.profile_picture_url}
                  />
                  <span className="text-sm">
                    {formatName(diagnosis.created_by)}
                  </span>
                </div>
              </div>
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
              {diagnosis.note && (
                <DropdownMenuItem onClick={() => setShowNote(!showNote)}>
                  {showNote ? t("hide_note") : t("see_note")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="mt-4 flex gap-8 flex-wrap">
        <div>
          <div className="text-sm text-gray-600 mb-1">{t("verification")}</div>
          <Badge
            variant={
              DIAGNOSIS_VERIFICATION_STATUS_COLORS[
                diagnosis.verification_status
              ]
            }
            className="break-words"
          >
            {t(diagnosis.verification_status)}
          </Badge>
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-1">{t("onset")}</div>
          {diagnosis.onset?.onset_datetime ? (
            <RelativeDateTooltip date={diagnosis.onset.onset_datetime} />
          ) : (
            "-"
          )}
        </div>
      </div>
      {showNote && diagnosis.note && (
        <div className="relative border border-gray-200 rounded-md p-3 bg-gray-50 mt-3">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 size-6 p-0"
            onClick={() => setShowNote(false)}
          >
            <X size={14} />
            <span className="sr-only">{t("close")}</span>
          </Button>
          <p className="break-words whitespace-pre-wrap pr-8 text-sm text-gray-700">
            {diagnosis.note}
          </p>
        </div>
      )}
    </div>
  );
};
export const DiagnosisTable = ({
  diagnoses,
  patientId,
}: {
  diagnoses: Diagnosis[];
  patientId: string;
}) => {
  const { t } = useTranslation();
  const subpathMatch = usePathParams("/facility/:facilityId/*");
  const facilityId = subpathMatch?.facilityId;
  const isMobile = useIsMobile();

  return isMobile ? (
    <div className="space-y-2">
      {diagnoses.map((diagnosis) => (
        <DiagnosisCard
          key={diagnosis.id}
          diagnosis={diagnosis}
          patientId={patientId}
          facilityId={facilityId}
        />
      ))}
    </div>
  ) : (
    <div className="max-w-6xl mx-auto mb-4 overflow-x-auto">
      <div className="min-w-xl pb-2">
        <div className="min-w-full">
          <div className="grid grid-cols-13 px-4 font-semibold mb-3">
            <div className="col-span-6 text-base">{t("diagnosis")}</div>
            <div className="col-span-2 text-center text-base">
              {t("status")}
            </div>
            <div className="col-span-2 text-center text-base">
              {t("verification")}
            </div>
            <div className="col-span-2 text-center text-base">{t("onset")}</div>
            <div className="col-span-1 text-center"></div>
          </div>
          <div>
            {diagnoses.map((diagnosis) => (
              <DiagnosisRow
                key={diagnosis.id}
                diagnosis={diagnosis}
                patientId={patientId}
                facilityId={facilityId}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
