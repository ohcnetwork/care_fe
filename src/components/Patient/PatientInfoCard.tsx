import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";

import { Avatar } from "@/components/Common/Avatar";
import ButtonV2 from "@/components/Common/ButtonV2";

import useAuthUser from "@/hooks/useAuthUser";

import { triggerGoal } from "@/Integrations/Plausible";
import { PLUGIN_Component } from "@/PluginEngine";
import { formatPatientAge } from "@/Utils/utils";
import { Encounter } from "@/types/emr/encounter";
import { Patient } from "@/types/emr/newPatient";

export interface PatientInfoCardProps {
  patient: Patient;
  encounter: Encounter;
  fetchPatientData?: (state: { aborted: boolean }) => void;
}

export default function PatientInfoCard(props: PatientInfoCardProps) {
  const authUser = useAuthUser();
  const { patient, encounter } = props;

  return (
    <>
      <section className="flex flex-col lg:flex-row">
        <div
          className="flex w-full flex-col bg-white px-4 pt-2 lg:flex-row"
          id="patient-infobadges"
        >
          <div className="flex justify-evenly lg:justify-normal">
            <div className="flex flex-col items-start lg:items-center">
              <div className="w-24 min-w-20 bg-secondary-200 h-24">
                <Avatar name={patient.name} className="w-full h-full" />
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div
                className="mb-2 flex flex-col justify-center text-xl font-semibold capitalize lg:hidden"
                id="patient-name-consultation"
              >
                {patient.name}
                <div className="ml-3 mr-2 mt-[6px] text-sm font-semibold text-secondary-600">
                  {formatPatientAge(patient, true)} • {patient.gender}
                </div>
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col items-center gap-4 space-y-2 lg:items-start lg:gap-0 lg:pl-2">
            <div className="flex flex-col flex-wrap items-center justify-center lg:items-start lg:justify-normal">
              <div
                className="mb-2 hidden flex-row text-xl font-semibold capitalize lg:flex"
                id="patient-name-consultation"
              >
                {patient.name}
                <div className="ml-3 mr-2 mt-[6px] text-sm font-semibold text-secondary-600">
                  {formatPatientAge(patient, true)} • {patient.gender}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm sm:flex-row">
                <div
                  className="flex w-full flex-wrap items-center justify-center gap-2 text-sm text-secondary-900 sm:flex-row sm:text-sm md:pr-10 lg:justify-normal"
                  id="patient-consultationbadges"
                >
                  <Badge variant="outline">{encounter.status}</Badge>

                  {patient.blood_group && (
                    <Badge title="Blood Group" variant="outline">
                      {patient.blood_group}
                    </Badge>
                  )}
                  {encounter.hospitalization?.discharge_disposition && (
                    <Badge title="Discharge Disposition" variant="outline">
                      {encounter.hospitalization.discharge_disposition}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          className="flex flex-col items-center justify-end gap-4 px-4 py-1 2xl:flex-row"
          id="consultation-buttons"
        >
          {encounter && encounter.status === "in_progress" && (
            <div className="flex w-full flex-col gap-3 lg:w-auto 2xl:flex-row">
              <ButtonV2
                variant="primary"
                href={`/patient/${patient.id}/encounter/${encounter.id}/updates`}
                className="w-full"
                onClick={() => {
                  triggerGoal("Patient Card Button Clicked", {
                    buttonName: "Update Encounter",
                    encounterId: encounter.id,
                    userId: authUser?.id,
                  });
                }}
              >
                <span className="flex w-full items-center justify-center gap-2">
                  <CareIcon icon="l-plus" className="text-xl" />
                  <p className="font-semibold">Update Encounter</p>
                </span>
              </ButtonV2>
            </div>
          )}
        </div>
      </section>

      <PLUGIN_Component __name="ExtendPatientInfoCard" {...props} />
    </>
  );
}
