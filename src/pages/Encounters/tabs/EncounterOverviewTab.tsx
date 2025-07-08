import { Plus } from "lucide-react";
import { usePathParams } from "raviger";
import { Link, navigate } from "raviger";

import { Button } from "@/components/ui/button";

import SideOverview from "@/components/Facility/ConsultationDetails/OverviewSideBar";
import QuestionnaireResponsesList from "@/components/Facility/ConsultationDetails/QuestionnaireResponsesList";
import { AllergyList } from "@/components/Patient/allergy/list";
import { DiagnosisList } from "@/components/Patient/diagnosis/list";
import { SymptomsList } from "@/components/Patient/symptoms/list";
import { QuestionnaireSearch } from "@/components/Questionnaire/QuestionnaireSearch";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import EncounterOverviewDevices from "@/pages/Facility/settings/devices/components/EncounterOverviewDevices";
import { inactiveEncounterStatus } from "@/types/emr/encounter";

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
  const subpathMatch = usePathParams("/facility/:facilityId/*");
  const facilityIdExists = !!subpathMatch?.facilityId;

  const {
    selectedEncounter: encounter,
    patientId,
    selectedEncounterId: encounterId,
    selectedEncounterPermissions: {
      canViewClinicalData,
      canViewEncounter,
      canSubmitEncounterQuestionnaire,
    },
  } = useEncounter();

  const canAccess = canViewEncounter || canViewClinicalData;
  const canEdit =
    facilityIdExists &&
    canSubmitEncounterQuestionnaire &&
    !inactiveEncounterStatus.includes(encounter?.status ?? "");

  return (
    <div className="flex flex-col gap-4">
      {/* Main Content Area */}
      <div className="flex flex-col xl:flex-row gap-4">
        {/* Left Column - Symptoms, Diagnoses, and Questionnaire Responses */}
        <div className="flex-1 space-y-4" data-cy="encounter-overview">
          {canEdit && (
            <div className="flex justify-between gap-2">
              <div className="flex flex-wrap gap-2 justify-start">
                {actionLinks.map((link) => {
                  return (
                    <Button
                      size="sm"
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
              </div>
              <div className=" md:block hidden">
                <QuestionnaireSearch
                  size="sm"
                  onSelect={(selected) =>
                    navigate(`questionnaire/${selected.slug}`)
                  }
                />
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
        {encounter && (
          <SideOverview
            encounter={encounter}
            canAccess={canAccess}
            canEdit={canEdit}
          />
        )}
      </div>
    </div>
  );
};
