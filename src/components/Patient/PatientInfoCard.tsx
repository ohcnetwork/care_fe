import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BedSingle,
  Building,
  ChevronDown,
  CircleCheck,
  CircleDashed,
  Clock,
  Droplet,
} from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Avatar } from "@/components/Common/Avatar";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import { formatDateTime, formatPatientAge } from "@/Utils/utils";
import { Encounter, completedEncounterStatus } from "@/types/emr/encounter";
import { Patient } from "@/types/emr/newPatient";

import ManageEncounterOrganizations from "./ManageEncounterOrganizations";

const QUESTIONNAIRE_OPTIONS = [
  {
    slug: "encounter",
    title: "Update Encounter",
  },
  {
    slug: "community-nurse",
    title: "Community Nurse Form",
  },
  {
    slug: "recommend_discharge_v2",
    title: "Recommend Discharge",
  },
] as const;

export interface PatientInfoCardProps {
  patient: Patient;
  encounter: Encounter;
  fetchPatientData?: (state: { aborted: boolean }) => void;
}

export default function PatientInfoCard(props: PatientInfoCardProps) {
  const { patient, encounter } = props;
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { mutate: updateEncounter } = useMutation({
    mutationFn: mutate(routes.encounter.update, {
      pathParams: { id: encounter.id },
    }),
    onSuccess: () => {
      toast.success(t("encounter_marked_as_complete"));
      queryClient.invalidateQueries({ queryKey: ["encounter", encounter.id] });
    },
    onError: () => {
      toast.error(t("error_updating_encounter"));
    },
  });

  const handleMarkAsComplete = () => {
    updateEncounter({
      ...encounter,
      status: "completed",
      organizations: encounter.organizations.map((org) => org.id),
      patient: encounter.patient.id,
      encounter_class: encounter.encounter_class,
      period: encounter.period,
      hospitalization: encounter.hospitalization,
      priority: encounter.priority,
      external_identifier: encounter.external_identifier,
      facility: encounter.facility.id,
    });
  };

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
                className="hidden flex-row text-xl font-semibold capitalize lg:flex"
                id="patient-name-consultation"
              >
                {patient.name}
                <div className="ml-3 mr-2 mt-[6px] text-sm font-semibold text-secondary-600">
                  {formatPatientAge(patient, true)} • {patient.gender}
                </div>
              </div>
              <div className="grid gap-4 grid-cols-3">
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">
                    Start Date
                  </span>
                  <span className="text-xs">
                    {props.encounter.period.start
                      ? formatDateTime(props.encounter.period.start)
                      : "Not started"}
                  </span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">
                    End Date
                  </span>
                  <span className="text-xs">
                    {props.encounter.period.end
                      ? formatDateTime(props.encounter.period.end)
                      : "Ongoing"}
                  </span>
                </div>
                {props.encounter.external_identifier && (
                  <div className="flex flex-col space-y-1 col-span-1">
                    <span className="text-xs text-muted-foreground font-medium">
                      Hospital Identifier
                    </span>
                    <span className="text-xs">
                      {props.encounter.external_identifier}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm sm:flex-row mt-2">
                <div
                  className="flex w-full flex-wrap items-center justify-center gap-2 text-sm text-secondary-900 sm:flex-row sm:text-sm md:pr-10 lg:justify-normal"
                  id="patient-consultationbadges"
                >
                  <Popover>
                    <PopoverTrigger asChild>
                      <div>
                        <Badge
                          className="capitalize gap-1 py-1 px-2 cursor-pointer hover:bg-secondary-100"
                          variant="outline"
                          title={`Encounter Status: ${t(`encounter_status__${props.encounter.status}`)}`}
                        >
                          {completedEncounterStatus.includes(
                            props.encounter.status,
                          ) ? (
                            <CircleCheck
                              className="w-4 h-4 text-green-300"
                              fill="green"
                            />
                          ) : (
                            <CircleDashed className="w-4 h-4 text-yellow-500" />
                          )}
                          {t(`encounter_status__${props.encounter.status}`)}
                          <ChevronDown className="h-3 w-3 opacity-50" />
                        </Badge>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Status History</h4>
                        {encounter.status_history.history.map(
                          (history, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-sm"
                            >
                              <span className="text-muted-foreground">
                                {formatDateTime(history.moved_at)}
                              </span>
                              <span className="font-medium">
                                {t(`encounter_status__${history.status}`)}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <div>
                        <Badge
                          className="capitalize gap-1 py-1 px-2 cursor-pointer hover:bg-secondary-100"
                          variant="outline"
                          title={`Encounter Class: ${props.encounter.encounter_class}`}
                        >
                          <BedSingle
                            className="w-4 h-4 text-blue-400"
                            fill="#93C5FD"
                          />
                          {t(
                            `encounter_class__${props.encounter.encounter_class}`,
                          )}
                          <ChevronDown className="h-3 w-3 opacity-50" />
                        </Badge>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Class History</h4>
                        {encounter.encounter_class_history.history.map(
                          (history, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-sm"
                            >
                              <span className="text-muted-foreground">
                                {formatDateTime(history.moved_at)}
                              </span>
                              <span className="font-medium">
                                {t(`encounter_class__${history.status}`)}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Badge
                    className="capitalize gap-1 py-1 px-2"
                    variant="outline"
                    title={`Priority: ${t(
                      `encounter_priority__${props.encounter.priority.toLowerCase()}`,
                    )}`}
                  >
                    <Clock className="w-4 h-4 text-yellow-500" />
                    {t(
                      `encounter_priority__${props.encounter.priority.toLowerCase()}`,
                    )}
                  </Badge>

                  {patient.blood_group && (
                    <Badge
                      className="capitalize gap-1 py-1 px-2"
                      variant="outline"
                      title={`Blood Group: ${patient.blood_group?.replace("_", " ")}`}
                    >
                      <Droplet className="w-4 h-4 text-red-300" fill="red" />
                      {patient.blood_group?.replace("_", " ")}
                    </Badge>
                  )}

                  {encounter.hospitalization?.discharge_disposition && (
                    <Badge title="Discharge Disposition" variant="outline">
                      {encounter.hospitalization.discharge_disposition}
                    </Badge>
                  )}

                  <ManageEncounterOrganizations
                    encounter={encounter}
                    facilityId={encounter.facility.id}
                    trigger={
                      <div className="flex flex-wrap gap-2">
                        {encounter.organizations.map((org) => (
                          <Badge
                            key={org.id}
                            className="capitalize gap-1 py-1 px-2 cursor-pointer hover:bg-secondary-100"
                            variant="outline"
                            title={`Organization: ${org.name}${org.description ? ` - ${org.description}` : ""}`}
                          >
                            <Building className="w-4 h-4 text-blue-400" />
                            {org.name}
                          </Badge>
                        ))}
                        {encounter.organizations.length === 0 && (
                          <Badge
                            className="capitalize gap-1 py-1 px-2 cursor-pointer hover:bg-secondary-100"
                            variant="outline"
                          >
                            <Building className="w-4 h-4 text-blue-400" />
                            Add Organizations
                          </Badge>
                        )}
                      </div>
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          className="flex flex-col items-center justify-end gap-4 px-4 py-1 2xl:flex-row"
          id="consultation-buttons"
        >
          {!completedEncounterStatus.includes(encounter.status) && (
            <div className="flex w-full flex-col gap-3 lg:w-auto 2xl:flex-row">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="primary">
                    {t("update")}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {QUESTIONNAIRE_OPTIONS.map((option) => (
                    <DropdownMenuItem key={option.slug} asChild>
                      <Link
                        href={`/facility/${encounter.facility.id}/patient/${patient.id}/encounter/${encounter.id}/questionnaire/${option.slug}`}
                        className="cursor-pointer text-gray-800"
                      >
                        {t(option.title)}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={handleMarkAsComplete}>
                    {t("mark_as_complete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
