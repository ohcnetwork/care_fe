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
  SYMPTOM_CLINICAL_STATUS_COLORS,
  SYMPTOM_SEVERITY_COLORS,
  SYMPTOM_VERIFICATION_STATUS_COLORS,
  Symptom,
} from "@/types/emr/symptom/symptom";

const SymptomRow = ({
  symptom,
  patientId,
  facilityId,
}: {
  symptom: Symptom;
  patientId: string;
  facilityId?: string;
}) => {
  const [showNote, setShowNote] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <div className="bg-white rounded border border-gray-200 mb-3">
        <div className="grid grid-cols-14 divide-x">
          <div className="col-span-5 px-2 py-1 bg-gray-100 break-words whitespace-normal text-base font-semibold text-gray-900">
            {symptom.code.display}
          </div>
          <div className="col-span-2 flex items-center justify-center">
            <Badge
              variant={SYMPTOM_SEVERITY_COLORS[symptom.severity]}
              className="whitespace-nowrap text-sm max-w-full truncate px-1"
            >
              {t(symptom.severity)}
            </Badge>
          </div>
          <div className="col-span-2 flex items-center justify-center">
            <Badge
              variant={SYMPTOM_CLINICAL_STATUS_COLORS[symptom.clinical_status]}
              className="whitespace-nowrap text-sm max-w-full truncate px-1"
            >
              {t(symptom.clinical_status)}
            </Badge>
          </div>
          <div className="col-span-2 flex items-center justify-center px-2">
            <Badge
              variant={
                SYMPTOM_VERIFICATION_STATUS_COLORS[symptom.verification_status]
              }
              className="whitespace-pre-wrap truncate text-sm max-w-full px-1"
              title={t(symptom.verification_status)}
            >
              {t(symptom.verification_status)}
            </Badge>
          </div>
          <div className="col-span-2 bg-gray-100 flex items-center justify-center">
            {symptom.onset?.onset_datetime ? (
              <RelativeDateTooltip date={symptom.onset.onset_datetime} />
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
                      name={formatName(symptom.created_by)}
                      className="size-5"
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
      {showNote && symptom.note && (
        <div className="border border-gray-200 rounded-md p-4 bg-gray-50 relative mb-3 mx-4">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 size-6 p-0"
            onClick={() => setShowNote(false)}
          >
            <X size={14} />
            <span className="sr-only">{t("close")}</span>
          </Button>
          <p className="text-sm text-gray-700 whitespace-pre-wrap pr-8 max-w-full break-words break-all">
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
}: {
  symptoms: Symptom[];
  patientId: string;
}) => {
  const { t } = useTranslation();
  const subpathMatch = usePathParams("/facility/:facilityId/*");
  const facilityId = subpathMatch?.facilityId;

  return (
    <div className="max-w-6xl mx-auto mb-4 overflow-x-auto">
      <div className="min-w-xl pb-2">
        <div className="min-w-full">
          <div className="grid grid-cols-14 px-4 font-semibold mb-3">
            <div className="col-span-5 text-base">{t("symptom")}</div>
            <div className="col-span-2 text-center text-base">
              {t("severity")}
            </div>
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
            {symptoms.map((symptom) => (
              <SymptomRow
                key={symptom.id}
                symptom={symptom}
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
