import { BadgeInfo, ExternalLink, File, X } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar } from "@/components/Common/Avatar";
import ClinicalInformationRow from "@/components/Patient/Common/ClinicalInformationRow";

import { formatName } from "@/Utils/utils";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import {
  ALLERGY_CLINICAL_STATUS_COLORS,
  ALLERGY_CRITICALITY_COLORS,
  ALLERGY_VERIFICATION_STATUS_COLORS,
  AllergyIntolerance,
} from "@/types/emr/allergyIntolerance/allergyIntolerance";

const AllergyCard = ({
  allergy,
  onViewEncounter,
}: {
  allergy: AllergyIntolerance;
  onViewEncounter?: () => void;
}) => {
  const [showNote, setShowNote] = useState(false);
  const { t } = useTranslation();
  return (
    <div className="border shadow rounded-md p-2 bg-white">
      <div className="flex justify-between items-start flex-wrap gap-2">
        <div className="flex-1">
          <div className="text-base font-semibold text-gray-900 break-words">
            {allergy.code.display}
          </div>
          <div className="italic text-gray-500">{t(allergy.category)}</div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={ALLERGY_CLINICAL_STATUS_COLORS[allergy.clinical_status]}
          >
            {t(allergy.clinical_status)}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="link"
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <BadgeInfo size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mx-1 w-28 text-xs p-1" align="end">
              {allergy.note && (
                <DropdownMenuItem
                  onClick={() => setShowNote(!showNote)}
                  className="flex items-center gap-1.5 px-2 py-1.5 font-medium text-xs"
                >
                  <File className="size-3.5" />
                  <span>{showNote ? t("hide_note") : t("see_note")}</span>
                </DropdownMenuItem>
              )}

              {!!onViewEncounter && (
                <DropdownMenuItem
                  onClick={onViewEncounter}
                  className="flex items-center gap-1.5 px-2 py-1.5 font-medium text-xs"
                >
                  <ExternalLink className="size-3.5" />
                  <span>{t("go_to_encounter")}</span>
                </DropdownMenuItem>
              )}

              {(!!onViewEncounter || allergy.note) && (
                <div className="my-1 border-t border-dashed border-gray-300" />
              )}

              <div className="p-1 text-xs">
                <div className="text-gray-500">{t("reported_by")}:</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <Avatar
                    name={formatName(allergy.created_by)}
                    className="size-5"
                    imageUrl={allergy.created_by.profile_picture_url}
                  />
                  <span className="font-medium text-gray-900 truncate">
                    {formatName(allergy.created_by)}
                  </span>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="mt-4 flex gap-8 flex-wrap">
        <div>
          <div className="text-sm text-gray-600 mb-1">{t("criticality")}</div>
          <Badge variant={ALLERGY_CRITICALITY_COLORS[allergy.criticality]}>
            {t(allergy.criticality)}
          </Badge>
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-1">{t("verification")}</div>
          <Badge
            variant={
              ALLERGY_VERIFICATION_STATUS_COLORS[allergy.verification_status]
            }
          >
            {t(allergy.verification_status)}
          </Badge>
        </div>
      </div>
      {showNote && allergy.note && (
        <div className="col-span-full relative border border-gray-200 p-2 bg-gray-50 rounded mt-2 rounded-t-none">
          <div className="text-sm font-semibold text-gray-800">
            {t("note")}
            {":"}
          </div>

          <Button
            variant="link"
            className="absolute top-0 right-2 flex items-center gap-1 p-0 text-sm"
            onClick={() => setShowNote(false)}
          >
            <X />
            <span className="underline">{t("hide_note")}</span>
          </Button>

          <p className="text-sm text-gray-700 whitespace-pre-wrap pr-8 max-w-full break-words mt-2">
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
  showViewEncounter = true,
}: {
  allergies: AllergyIntolerance[];
  patientId: string;
  showViewEncounter?: boolean;
}) => {
  const { t } = useTranslation();
  const { facilityId } = useCurrentFacilitySilently();
  const baseHeaderClasses =
    "text-center border-y border-gray-200 bg-gray-50 p-1 text-gray-700 text-sm";

  return (
    <>
      {/* Mobile: Card layout */}
      <div className="space-y-3 block sm:hidden">
        {allergies.map((allergy) => {
          return (
            <AllergyCard
              key={allergy.id}
              allergy={allergy}
              onViewEncounter={
                showViewEncounter
                  ? () =>
                      navigate(
                        facilityId
                          ? `/facility/${facilityId}/patient/${patientId}/encounter/${allergy.encounter}/updates`
                          : `/organization/organizationId/patient/${patientId}/encounter/${allergy.encounter}/updates`,
                      )
                  : undefined
              }
            />
          );
        })}
      </div>
      {/* Desktop: Table layout */}
      <div className="overflow-x-auto hidden sm:block">
        <div className="min-w-xl pb-2">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-y-2">
            <div className="px-3 border border-gray-200 rounded-tl-lg bg-gray-50 py-1 text-gray-700 text-sm">
              {t("allergen")}
            </div>

            <div className={cn(baseHeaderClasses)}>{t("status")}</div>

            <div className={cn(baseHeaderClasses, "border-x")}>
              {t("criticality")}
            </div>

            <div className={cn(baseHeaderClasses)}>{t("verification")}</div>

            <div
              className={cn(
                "text-center border border-l-0 border-gray-200 rounded-tr-lg bg-gray-50",
              )}
            ></div>
            {allergies.map((allergy) => (
              <ClinicalInformationRow
                key={allergy.id}
                onViewEncounter={
                  showViewEncounter
                    ? () =>
                        navigate(
                          facilityId
                            ? `/facility/${facilityId}/patient/${patientId}/encounter/${allergy.encounter}/updates`
                            : `/organization/organizationId/patient/${patientId}/encounter/${allergy.encounter}/updates`,
                        )
                    : undefined
                }
                note={allergy.note}
                createdBy={allergy.created_by}
                columns={[
                  {
                    key: "display",
                    className:
                      "bg-gray-100 break-words whitespace-normal text-base font-semibold text-gray-900 rounded-l",
                    render: () => allergy.code.display,
                  },
                  {
                    key: "status",
                    render: () => (
                      <Badge
                        variant={
                          ALLERGY_CLINICAL_STATUS_COLORS[
                            allergy.clinical_status
                          ]
                        }
                      >
                        {t(allergy.clinical_status)}
                      </Badge>
                    ),
                  },
                  {
                    key: "criticality",
                    render: () => (
                      <Badge
                        variant={
                          ALLERGY_CRITICALITY_COLORS[allergy.criticality]
                        }
                      >
                        {t(allergy.criticality)}
                      </Badge>
                    ),
                  },
                  {
                    key: "verification",
                    render: () => (
                      <Badge
                        variant={
                          ALLERGY_VERIFICATION_STATUS_COLORS[
                            allergy.verification_status
                          ]
                        }
                      >
                        {t(allergy.verification_status)}
                      </Badge>
                    ),
                  },
                ]}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
