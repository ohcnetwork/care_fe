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
import RelativeDateTooltip from "@/components/Common/RelativeDateTooltip";
import ClinicalInformationRow from "@/components/Patient/Common/ClinicalInformationRow";

import { formatName } from "@/Utils/utils";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import {
  DIAGNOSIS_CLINICAL_STATUS_COLORS,
  DIAGNOSIS_VERIFICATION_STATUS_COLORS,
  type Diagnosis,
} from "@/types/emr/diagnosis/diagnosis";

const DiagnosisCard = ({
  diagnosis,
  onViewEncounter,
}: {
  diagnosis: Diagnosis;
  onViewEncounter?: () => void;
}) => {
  const [showNote, setShowNote] = useState(false);
  const { t } = useTranslation();
  return (
    <div className="border shadow rounded-md p-2 bg-white">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div className="flex-1 font-semibold text-gray-900 break-words">
          {diagnosis.code.display}
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={
              DIAGNOSIS_CLINICAL_STATUS_COLORS[diagnosis.clinical_status]
            }
          >
            {t(diagnosis.clinical_status)}
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
              {diagnosis.note && (
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

              {(!!onViewEncounter || diagnosis.note) && (
                <div className="my-1 border-t border-dashed border-gray-300" />
              )}

              <div className="p-1 text-xs">
                <div className="text-gray-500">{t("reported_by")}:</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <Avatar
                    name={formatName(diagnosis.created_by)}
                    className="size-5"
                    imageUrl={diagnosis.created_by.profile_picture_url}
                  />
                  <span className="font-medium text-gray-900 truncate">
                    {formatName(diagnosis.created_by)}
                  </span>
                </div>
              </div>
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
          >
            {t(diagnosis.verification_status)}
          </Badge>
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-1">{t("onset")}</div>
          {diagnosis.onset?.onset_datetime ? (
            <RelativeDateTooltip
              date={diagnosis.onset.onset_datetime}
              className="font-normal"
            />
          ) : (
            "-"
          )}
        </div>
      </div>
      {showNote && diagnosis.note && (
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
  showViewEncounter = true,
}: {
  diagnoses: Diagnosis[];
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
        {diagnoses.map((diagnosis) => (
          <DiagnosisCard
            key={diagnosis.id}
            diagnosis={diagnosis}
            onViewEncounter={
              showViewEncounter
                ? () =>
                    navigate(
                      facilityId
                        ? `/facility/${facilityId}/patient/${patientId}/encounter/${diagnosis.encounter}/updates`
                        : `/organization/organizationId/patient/${patientId}/encounter/${diagnosis.encounter}/updates`,
                    )
                : undefined
            }
          />
        ))}
      </div>
      {/* Desktop: Table layout */}
      <div className="overflow-x-auto hidden sm:block">
        <div className="min-w-xl pb-2">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-y-2">
            <div className="px-3 border border-gray-200 rounded-tl-lg bg-gray-50 py-1 text-gray-700 text-sm">
              {t("diagnosis")}
            </div>

            <div className={cn(baseHeaderClasses, "border-r")}>
              {t("status")}
            </div>

            <div className={cn(baseHeaderClasses)}>{t("verification")}</div>

            <div className={cn(baseHeaderClasses, "border-l")}>
              {t("onset")}
            </div>

            <div
              className={cn(
                "text-center border border-l-0 border-gray-200 rounded-tr-lg bg-gray-50",
              )}
            ></div>

            {diagnoses.map((diagnosis) => (
              <ClinicalInformationRow
                key={diagnosis.id}
                note={diagnosis.note}
                createdBy={diagnosis.created_by}
                onViewEncounter={
                  showViewEncounter
                    ? () =>
                        navigate(
                          facilityId
                            ? `/facility/${facilityId}/patient/${patientId}/encounter/${diagnosis.encounter}/updates`
                            : `/organization/organizationId/patient/${patientId}/encounter/${diagnosis.encounter}/updates`,
                        )
                    : undefined
                }
                columns={[
                  {
                    key: "display",
                    className:
                      "bg-gray-100 break-words whitespace-normal text-base font-semibold text-gray-900 rounded-l",
                    render: () => diagnosis.code.display,
                  },
                  {
                    key: "status",
                    render: () => (
                      <Badge
                        variant={
                          DIAGNOSIS_CLINICAL_STATUS_COLORS[
                            diagnosis.clinical_status
                          ]
                        }
                      >
                        {t(diagnosis.clinical_status)}
                      </Badge>
                    ),
                  },
                  {
                    key: "verification",
                    render: () => (
                      <Badge
                        variant={
                          DIAGNOSIS_VERIFICATION_STATUS_COLORS[
                            diagnosis.verification_status
                          ]
                        }
                      >
                        {t(diagnosis.verification_status)}
                      </Badge>
                    ),
                  },
                  {
                    key: "onset",
                    className: "bg-gray-100",
                    render: () =>
                      diagnosis.onset?.onset_datetime ? (
                        <RelativeDateTooltip
                          date={diagnosis.onset.onset_datetime}
                        />
                      ) : (
                        "-"
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
