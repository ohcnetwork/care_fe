import { BadgeInfo, ExternalLink, File, X } from "lucide-react";
import { navigate, usePathParams } from "raviger";
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
import { GenericRow } from "@/components/Patient/Util";

import { useIsMobile } from "@/hooks/use-mobile";

import { formatName } from "@/Utils/utils";
import {
  ALLERGY_CLINICAL_STATUS_COLORS,
  ALLERGY_CRITICALITY_COLORS,
  ALLERGY_VERIFICATION_STATUS_COLORS,
  AllergyIntolerance,
} from "@/types/emr/allergyIntolerance/allergyIntolerance";

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
    <div className="border-1 shadow rounded-md p-4 bg-white">
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
            className="whitespace-nowrap"
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
            <DropdownMenuContent>
              {allergy.note && (
                <DropdownMenuItem
                  onClick={() => setShowNote(!showNote)}
                  className="flex items-center gap-2 px-3 py-2 font-semibold"
                >
                  <File className="size-4" />
                  <span>{showNote ? t("hide_note") : t("see_note")}</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() =>
                  navigate(
                    facilityId
                      ? `/facility/${facilityId}/patient/${patientId}/encounter/${allergy.encounter}/updates`
                      : `/organization/organizationId/patient/${patientId}/encounter/${allergy.encounter}/updates`,
                  )
                }
                className="flex items-center gap-2 px-3 py-2 font-semibold"
              >
                <ExternalLink className="size-4" />
                <span>{t("go_to_encounter")}</span>
              </DropdownMenuItem>

              <div className="my-2 border-t border-dashed border-gray-300" />

              <div className="p-1 text-sm">
                <div className="text-gray-500">{t("reported_by")}:</div>
                <div className="mt-1 flex items-center gap-2">
                  <Avatar
                    name={formatName(allergy.created_by)}
                    className="size-6"
                    imageUrl={allergy.created_by.profile_picture_url}
                  />
                  <span className="font-semibold text-gray-900">
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
          <Badge
            variant={ALLERGY_CRITICALITY_COLORS[allergy.criticality]}
            className="whitespace-nowrap"
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
            className="whitespace-nowrap"
          >
            {t(allergy.verification_status)}
          </Badge>
        </div>
      </div>
      {showNote && allergy.note && (
        <div className="col-span-full p-2 bg-gray-50 rounded mt-2">
          <div className="flex flex-row w-full justify-between">
            <div className="text-sm font-semibold text-gray-800">
              {t("note")} :
            </div>
            <Button
              variant={null}
              className="size-6"
              onClick={() => setShowNote(false)}
            >
              <X size={14} />
              <span className="sr-only">{t("close")}</span>
            </Button>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap pr-8 max-w-full break-words">
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
  const { facilityId } = usePathParams("/facility/:facilityId/*") ?? {};
  const isMobile = useIsMobile();
  const baseHeaderClasses =
    "text-center border-y border-gray-200 bg-gray-50 p-1 text-gray-700";

  return isMobile ? (
    <div className="space-y-3">
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
    <div className="max-w-6xl mb-4 overflow-x-auto">
      <div className="min-w-xl pb-2">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-y-2">
          <div className="px-3 border border-gray-200 rounded-tl-lg bg-gray-50 py-1 text-gray-700">
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
            <GenericRow
              key={allergy.id}
              item={allergy}
              patientId={patientId}
              facilityId={facilityId}
              getEncounterId={(item) => item.encounter}
              note={allergy.note}
              createdBy={allergy.created_by}
              columns={[
                {
                  key: "display",
                  className:
                    "bg-gray-100 break-words whitespace-normal text-base font-semibold text-gray-900 rounded-l",
                  render: (item) => item.code.display,
                },
                {
                  key: "status",
                  render: (item) => (
                    <Badge
                      variant={
                        ALLERGY_CLINICAL_STATUS_COLORS[item.clinical_status]
                      }
                      className="whitespace-nowrap"
                    >
                      {t(item.clinical_status)}
                    </Badge>
                  ),
                },
                {
                  key: "criticality",
                  render: (item) => (
                    <Badge
                      variant={ALLERGY_CRITICALITY_COLORS[item.criticality]}
                      className="whitespace-nowrap"
                    >
                      {t(item.criticality)}
                    </Badge>
                  ),
                },
                {
                  key: "verification",
                  render: (item) => (
                    <Badge
                      variant={
                        ALLERGY_VERIFICATION_STATUS_COLORS[
                          item.verification_status
                        ]
                      }
                      className="whitespace-nowrap"
                    >
                      {t(item.verification_status)}
                    </Badge>
                  ),
                },
              ]}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
