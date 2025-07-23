import { useQuery } from "@tanstack/react-query";
import { DropletIcon, HandIcon, Plus } from "lucide-react";
import { Link, navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import SideOverview from "@/components/Facility/ConsultationDetails/OverviewSideBar";
import QuestionnaireResponsesList from "@/components/Facility/ConsultationDetails/QuestionnaireResponsesList";
import { AllergyList } from "@/components/Patient/allergy/list";
import { DiagnosisList } from "@/components/Patient/diagnosis/list";
import { SymptomsList } from "@/components/Patient/symptoms/list";
import { QuestionnaireSearch } from "@/components/Questionnaire/QuestionnaireSearch";

import { useIsMobile } from "@/hooks/use-mobile";

import query from "@/Utils/request/query";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import EncounterOverviewDevices from "@/pages/Facility/settings/devices/components/EncounterOverviewDevices";
import allergyIntoleranceApi from "@/types/emr/allergyIntolerance/allergyIntoleranceApi";
import {
  completedEncounterStatus,
  inactiveEncounterStatus,
} from "@/types/emr/encounter/encounter";

const actionLinks = [
  {
    href: "questionnaire/allergy_intolerance",
    label: "Add Allergy",
  },
  {
    href: "questionnaire/diagnosis",
    label: "Add Diagnosis",
  },
  {
    href: "questionnaire/symptom",
    label: "Add Symptoms",
  },
];

export const EncounterOverviewTab = () => {
  const { t } = useTranslation();

  const {
    selectedEncounter: encounter,
    patientId,
    patient,
    selectedEncounterId: encounterId,
    selectedEncounterPermissions: {
      canViewClinicalData,
      canViewEncounter,
      canSubmitEncounterQuestionnaire,
    },
    currentEncounter,
    currentEncounterId,
    facilityId,
  } = useEncounter();

  const { data: allergies } = useQuery({
    queryKey: ["allergy-intolerance", patientId, "confirmed"],
    queryFn: query(allergyIntoleranceApi.getAllergy, {
      pathParams: { patientId },
      queryParams: { verification_status: "confirmed" },
    }),
    enabled:
      currentEncounter &&
      !completedEncounterStatus.includes(currentEncounter.status),
  });

  const canAccess = canViewEncounter || canViewClinicalData;
  const canEdit =
    !!facilityId &&
    encounterId === currentEncounterId &&
    canSubmitEncounterQuestionnaire &&
    !inactiveEncounterStatus.includes(encounter?.status ?? "");

  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col gap-4">
      {/* Main Content Area */}
      <div className="flex flex-col xl:flex-row gap-4">
        {/* Left Column - Symptoms, Diagnoses, and Questionnaire Responses */}
        <div className="flex-1 space-y-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex flex-row gap-3">
                <div className="flex flex-col items-start gap-1 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-600">
                    {t("blood_group")}:
                  </span>
                  <Badge variant="destructive">
                    <DropletIcon className="size-4" />
                    <span>
                      {t(
                        `BLOOD_GROUP_LONG__${patient?.blood_group || "unknown"}`,
                      )}
                    </span>
                  </Badge>
                </div>
                {!!allergies?.results.length && (
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-sm font-medium text-gray-600">
                      {t("allergies")}:
                    </span>
                    <Badge variant="yellow">
                      <HandIcon className="size-4" />
                      <span>
                        {allergies?.results
                          .map((allergy) => allergy.code.display)
                          .join(", ")}
                      </span>
                    </Badge>
                  </div>
                )}
              </div>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="md:w-auto w-full"
              >
                <Link
                  href={`/facility/${facilityId}/patient/${patientId}/history/symptoms?sourceUrl=${encodeURIComponent(`/facility/${facilityId}/patient/${patientId}/encounter/${currentEncounterId}/updates`)}`}
                >
                  <img
                    src="/images/icons/clinical_history.svg"
                    alt="Clinical History"
                    className="size-4"
                  />
                  {t("see_clinical_history")}
                </Link>
              </Button>
            </div>
          </div>
          {canEdit && (
            <div className="flex flex-col md:flex-row justify-between gap-2">
              <div className="grid grid-cols-2 w-full sm:grid-cols-4 md:grid-cols-5  gap-2 mx-auto md:mx-0">
                {actionLinks.map((link) => {
                  return (
                    <Button
                      size={isMobile ? "md" : "sm"}
                      variant="outline"
                      asChild
                      key={link.href}
                      className="[&_svg]:size-3"
                    >
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center gap-1 text-sm hover:text-gray-500 text-gray-950"
                      >
                        <Plus />
                        {link.label}
                      </Link>
                    </Button>
                  );
                })}
                <div className="col-span-2 sm:col-span-4 md:col-span-1">
                  <QuestionnaireSearch
                    size={isMobile ? "md" : "sm"}
                    onSelect={(selected) =>
                      navigate(`questionnaire/${selected.slug}`)
                    }
                    subjectType="encounter"
                  />
                </div>
              </div>
            </div>
          )}
          {/* Associated Devices Section */}
          {encounter && <EncounterOverviewDevices encounter={encounter} />}

          {/* Allergies Section */}
          <div>
            <AllergyList
              patientId={patientId}
              encounterId={encounterId}
              readOnly={!canEdit}
              encounterStatus={encounter?.status}
            />
          </div>
          {/* Symptoms Section */}
          <div>
            <SymptomsList
              patientId={patientId}
              encounterId={encounterId}
              readOnly={!canEdit}
            />
          </div>
          {/* Diagnoses Section */}
          <div>
            <DiagnosisList
              patientId={patientId}
              encounterId={encounterId}
              readOnly={!canEdit}
            />
          </div>
          {/* Questionnaire Responses Section */}
          <div>
            <QuestionnaireResponsesList
              encounter={encounter}
              patientId={patientId}
              canAccess={canAccess}
            />
          </div>
        </div>

        {/* Right Column */}
        {encounter ? (
          <SideOverview
            encounter={encounter}
            canAccess={canAccess}
            canEdit={canEdit}
          />
        ) : (
          <div className="flex-1 space-y-4 max-w-[18rem]">
            <CardListSkeleton count={3} />
          </div>
        )}
      </div>
    </div>
  );
};
