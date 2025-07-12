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
    <>
      <div className="bg-white rounded border border-gray-200 mb-3">
        <div className="grid grid-cols-13 divide-x">
          <div className="col-span-6 px-2 py-1 bg-gray-100 break-words whitespace-normal text-base font-semibold text-gray-900">
            {diagnosis.code.display}
          </div>
          <div className="col-span-2 p-1 flex items-center justify-center">
            <Badge
              variant={
                DIAGNOSIS_CLINICAL_STATUS_COLORS[diagnosis.clinical_status]
              }
              className="whitespace-nowrap text-xs md:text-sm"
            >
              {t(diagnosis.clinical_status)}
            </Badge>
          </div>
          <div className="col-span-2 p-1 flex items-center justify-center">
            <Badge
              variant={
                DIAGNOSIS_VERIFICATION_STATUS_COLORS[
                  diagnosis.verification_status
                ]
              }
              className="whitespace-nowrap capitalize text-xs md:text-sm"
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
          <div className="col-span-1 flex justify-between">
            <div className="flex-1 flex items-center justify-center px-2 py-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="link"
                    className="text-gray-500 hover:text-gray-700 p-1 md:p-2"
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
        </div>
      </div>
      {showNote && diagnosis.note && (
        <div className="border border-gray-200 rounded-md p-3 md:p-4 bg-gray-50 relative mb-3 mx-2 md:mx-4">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 size-6 p-0"
            onClick={() => setShowNote(false)}
          >
            <X size={14} className="md:size-4" />
            <span className="sr-only">{t("close")}</span>
          </Button>
          <p className="text-xs md:text-sm text-gray-700 whitespace-pre-wrap pr-8">
            {diagnosis.note}
          </p>
        </div>
      )}
    </>
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

  return (
    <div className="max-w-6xl mx-auto mb-4">
      <div className="overflow-x-auto pb-2">
        <div className="min-w-full">
          <div className="grid grid-cols-13 md:px-4 font-semibold mb-3">
            <div className="col-span-6 text-base">{t("diagnosis")}</div>
            <div className="col-span-2 text-center text-base">
              {t("severity")}
            </div>
            <div className="col-span-2 text-center text-base">
              {t("status")}
            </div>
            <div className="col-span-2 text-center text-base">{t("onset")}</div>
            <div className="col-span-1 text-center"></div>
          </div>
          <div>
            {diagnoses.map((diag) => (
              <DiagnosisRow
                key={diag.id}
                diagnosis={diag}
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
