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

import { useIsMobile } from "@/hooks/use-mobile";

import { formatName } from "@/Utils/utils";
import {
  ALLERGY_CLINICAL_STATUS_COLORS,
  ALLERGY_CRITICALITY_COLORS,
  ALLERGY_VERIFICATION_STATUS_COLORS,
  AllergyIntolerance,
} from "@/types/emr/allergyIntolerance/allergyIntolerance";

const AllergyRow = ({
  allergy,
  patientId,
  facilityId,
}: {
  allergy: AllergyIntolerance;
  patientId: string;
  facilityId?: string;
}) => {
  const [showNote, setShowNote] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <div className="bg-white rounded border border-gray-200 mb-3 overflow-x-auto w-full">
        <div className="grid grid-cols-13 divide-x w-full">
          <div className="col-span-6 px-2 py-1 bg-gray-100 break-words whitespace-normal text-base font-semibold text-gray-900">
            {allergy.code.display}{" "}
            <span className="text-gray-500 text-sm">
              ({t(allergy.category)})
            </span>
          </div>
          <div className="col-span-2 p-1 flex items-center justify-center">
            <Badge
              variant={ALLERGY_CLINICAL_STATUS_COLORS[allergy.clinical_status]}
              className="whitespace-nowrap text-xs md:text-sm"
            >
              {t(allergy.clinical_status)}
            </Badge>
          </div>
          <div className="col-span-2 p-1 flex items-center justify-center">
            <Badge
              variant={ALLERGY_CRITICALITY_COLORS[allergy.criticality]}
              className="capitalize text-xs md:text-sm break-words"
            >
              {t(allergy.criticality)}
            </Badge>
          </div>
          <div className="col-span-2 p-1 flex items-center justify-center">
            <Badge
              variant={
                ALLERGY_VERIFICATION_STATUS_COLORS[allergy.verification_status]
              }
              className="capitalize text-xs md:text-sm break-words"
            >
              {t(allergy.verification_status)}
            </Badge>
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
                        name={formatName(allergy.created_by)}
                        className="size-5"
                        imageUrl={allergy.created_by.profile_picture_url}
                      />
                      <span className="text-sm">
                        {formatName(allergy.created_by)}
                      </span>
                    </div>
                  </div>
                  <DropdownMenuItem
                    onClick={() =>
                      navigate(
                        facilityId
                          ? `/facility/${facilityId}/patient/${patientId}/encounter/${allergy.encounter}/updates`
                          : `/organization/organizationId/patient/${patientId}/encounter/${allergy.encounter}/updates`,
                      )
                    }
                  >
                    {t("view_encounter")}
                  </DropdownMenuItem>
                  {allergy.note && (
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
      {showNote && allergy.note && (
        <div className="border border-gray-200 rounded-md p-3 md:p-4 bg-gray-50 relative mb-3 mx-2 md:mx-4">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 size-6 p-0"
            onClick={() => setShowNote(false)}
          >
            <X size={14} />
            <span className="sr-only">{t("close")}</span>
          </Button>
          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words pr-8">
            {allergy.note}
          </p>
        </div>
      )}
    </>
  );
};

const AllergyCard = ({
  allergy,
  patientId,
  facilityId,
}: {
  allergy: AllergyIntolerance;
  patientId: string;
  facilityId?: string;
}) => {
  const [showNote, setShowNote] = useState(false);
  const { t } = useTranslation();
  return (
    <div className="border rounded-md p-4 bg-white">
      <div className="flex justify-between items-start flex-wrap gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-base font-semibold text-gray-900 break-words">
            {allergy.code.display}
          </div>
          <div className="italic text-gray-500">{t(allergy.category)}</div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={ALLERGY_CLINICAL_STATUS_COLORS[allergy.clinical_status]}
            className="whitespace-nowrap text-xs md:text-sm"
          >
            {t(allergy.clinical_status)}
          </Badge>
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
                    name={formatName(allergy.created_by)}
                    className="size-5"
                    imageUrl={allergy.created_by.profile_picture_url}
                  />
                  <span className="text-sm">
                    {formatName(allergy.created_by)}
                  </span>
                </div>
              </div>
              <DropdownMenuItem
                onClick={() =>
                  navigate(
                    facilityId
                      ? `/facility/${facilityId}/patient/${patientId}/encounter/${allergy.encounter}/updates`
                      : `/organization/organizationId/patient/${patientId}/encounter/${allergy.encounter}/updates`,
                  )
                }
              >
                {t("view_encounter")}
              </DropdownMenuItem>
              {allergy.note && (
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
          <div className="text-sm text-gray-600 mb-1">{t("criticality")}</div>
          <Badge
            variant={ALLERGY_CRITICALITY_COLORS[allergy.criticality]}
            className="capitalize text-xs md:text-sm break-words"
          >
            {t(allergy.criticality)}
          </Badge>
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-1">{t("verification")}</div>
          <Badge
            variant={
              ALLERGY_VERIFICATION_STATUS_COLORS[allergy.verification_status]
            }
            className="capitalize text-xs md:text-sm break-words"
          >
            {t(allergy.verification_status)}
          </Badge>
        </div>
      </div>
      {showNote && allergy.note && (
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
            {allergy.note}
          </p>
        </div>
      )}
    </div>
  );
};
export const AllergyTable = ({
  allergies,
  patientId,
}: {
  allergies: AllergyIntolerance[];
  patientId: string;
}) => {
  const { t } = useTranslation();
  const subpathMatch = usePathParams("/facility/:facilityId/*");
  const facilityId = subpathMatch?.facilityId;
  const isMobile = useIsMobile();

  return isMobile ? (
    <div className="space-y-2">
      {allergies.map((allergy) => (
        <AllergyCard
          key={allergy.id}
          allergy={allergy}
          patientId={patientId}
          facilityId={facilityId}
        />
      ))}
    </div>
  ) : (
    <div className="max-w-6xl mx-auto mb-4">
      <div className="overflow-x-auto pb-2">
        <div className="">
          <div className="grid grid-cols-13 font-semibold mb-3">
            <div className="col-span-6 text-base">{t("allergen")}</div>
            <div className="col-span-2 text-center text-base">
              {t("status")}
            </div>
            <div className="col-span-2 text-center text-base">
              {t("criticality")}
            </div>
            <div className="col-span-2 text-center text-base">
              {t("verification")}
            </div>
            <div className="col-span-1 text-center"></div>
          </div>
          <div>
            {allergies.map((allergy) => (
              <AllergyRow
                key={allergy.id}
                allergy={allergy}
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
