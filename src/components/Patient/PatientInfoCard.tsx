import {
  BedSingle,
  Building,
  ChevronDown,
  CircleCheck,
  CircleDashed,
  Clock,
  Droplet,
  SignatureIcon,
} from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Avatar } from "@/components/Common/Avatar";
import { ConsentSheet } from "@/components/Consent/ConsentSheet";
import EncounterActions from "@/components/Encounter/EncounterActions";
import { LocationSheet } from "@/components/Location/LocationSheet";
import { LocationTree } from "@/components/Location/LocationTree";
import LinkDepartmentsSheet from "@/components/Patient/LinkDepartmentsSheet";

import { PLUGIN_Component } from "@/PluginEngine";
import dayjs from "@/Utils/dayjs";
import { formatDateTime, formatPatientAge } from "@/Utils/utils";
import {
  Encounter,
  completedEncounterStatus,
  inactiveEncounterStatus,
} from "@/types/emr/encounter";
import { Patient } from "@/types/emr/newPatient";
import { FacilityOrganization } from "@/types/facilityOrganization/facilityOrganization";

export interface PatientInfoCardProps {
  patient: Patient;
  encounter: Encounter;
  fetchPatientData?: (state: { aborted: boolean }) => void;
  canWrite: boolean;
  disableButtons?: boolean;
}

export default function PatientInfoCard(props: PatientInfoCardProps) {
  const { patient, encounter, canWrite, disableButtons = false } = props;
  const { t } = useTranslation();

  return (
    <>
      <section className="flex flex-col lg:flex-row">
        <div
          className="flex w-full flex-col bg-white px-4 pt-4 lg:flex-row"
          id="patient-infobadges"
        >
          <div className="flex justify-items-start gap-2 lg:justify-normal">
            <div className="flex flex-col items-start lg:items-center">
              <div className="w-16 min-w-16 bg-secondary-200 h-16 md:size-24 rounded">
                <Avatar name={patient.name} className="w-full h-full" />
              </div>
            </div>
            <div className="flex justify-center">
              <div
                className="mb-2 flex flex-col text-base md:text-xl font-semibold capitalize lg:hidden"
                id="patient-name-consultation"
              >
                <Link
                  href={`/facility/${encounter.facility.id}/patient/${encounter.patient.id}`}
                  className="text-gray-950 font-semibold flex items-start leading-tight"
                  id="patient-details"
                  data-cy="patient-details-button"
                >
                  {patient.name}
                  <CareIcon
                    icon="l-external-link-alt"
                    className="size-3 opacity-50 mt-1"
                  />
                </Link>
                <div className="my-[2px] text-sm font-semibold text-secondary-600">
                  {formatPatientAge(patient, true)} •{" "}
                  {t(`GENDER__${patient.gender}`)}
                </div>
                {patient.deceased_datetime && (
                  <Badge
                    variant="destructive"
                    className="border-2 border-red-700 bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900"
                  >
                    <h3 className="text-xs font-normal sm:text-sm sm:font-medium">
                      {t("time_of_death")}
                      {": "}
                      {dayjs(patient.deceased_datetime).format(
                        "DD MMM YYYY, hh:mm A",
                      )}
                    </h3>
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col items-center gap-4 space-y-2 lg:items-start lg:gap-0 lg:pl-2">
            <div className="w-full flex flex-col flex-wrap justify-center lg:items-start lg:justify-normal">
              <div
                className="hidden flex-row text-xl font-semibold capitalize lg:flex"
                id="patient-name-consultation"
              >
                <Link
                  href={`/facility/${encounter.facility.id}/patient/${encounter.patient.id}`}
                  className="font-semibold flex items-center gap-1"
                  id="patient-details"
                  data-cy="patient-details-button"
                >
                  {patient.name}
                  <CareIcon
                    icon="l-external-link-alt"
                    className="size-4 opacity-70"
                  />
                </Link>
                <div className="ml-3 mr-2 mt-[6px] text-sm font-semibold text-secondary-600">
                  {formatPatientAge(patient, true)} •{" "}
                  {t(`GENDER__${patient.gender}`)}
                </div>
                {patient.deceased_datetime && (
                  <Badge
                    variant="destructive"
                    className="border-2 border-red-700 bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900"
                  >
                    <h3 className="text-sm font-medium">
                      {t("time_of_death")}
                      {": "}
                      {dayjs(patient.deceased_datetime).format(
                        "DD MMM YYYY, hh:mm A",
                      )}
                    </h3>
                  </Badge>
                )}
              </div>
              <div className="grid gap-4 grid-cols-3 mt-2 md:mt-0">
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500 font-medium">
                    {t("start_date")}
                  </span>
                  <span className="text-xs">
                    {props.encounter.period.start
                      ? formatDateTime(props.encounter.period.start)
                      : t("not_started")}
                  </span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-gray-500 font-medium">
                    {t("end_date")}
                  </span>
                  <span className="text-xs">
                    {props.encounter.period.end
                      ? formatDateTime(props.encounter.period.end)
                      : t("ongoing")}
                  </span>
                </div>
                {props.encounter.external_identifier && (
                  <div className="flex flex-col space-y-1 col-span-1">
                    <span className="text-xs text-gray-500 font-medium">
                      {t("hospital_identifier")}
                    </span>
                    <span className="text-xs">
                      {props.encounter.external_identifier}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm sm:flex-row mt-2">
                <div
                  className="flex w-full flex-wrap items-center justify-start gap-2 text-sm text-secondary-900 sm:flex-row sm:text-sm md:pr-10 lg:justify-normal"
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
                              className="size-4 text-green-300"
                              fill="green"
                            />
                          ) : (
                            <CircleDashed className="size-4 text-yellow-500" />
                          )}
                          {t(`encounter_status__${props.encounter.status}`)}
                          <ChevronDown className="size-3 opacity-50" />
                        </Badge>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent align={"start"} className="w-auto p-2">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">
                          {t("status_history")}
                        </h4>
                        {encounter.status_history.history.map(
                          (history, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-sm"
                            >
                              <span className="text-gray-500">
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
                            className="size-4 text-blue-400"
                            fill="#93C5FD"
                          />
                          {t(
                            `encounter_class__${props.encounter.encounter_class}`,
                          )}
                          <ChevronDown className="size-3 opacity-50" />
                        </Badge>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent align={"end"} className="w-auto p-2">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">
                          {t(`class_history`)}
                        </h4>
                        {encounter.encounter_class_history.history.map(
                          (history, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-sm"
                            >
                              <span className="text-gray-500">
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
                    <Clock className="size-4 text-yellow-500" />
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
                      <Droplet className="size-4 text-red-300" fill="red" />
                      {patient.blood_group?.replace("_", " ")}
                    </Badge>
                  )}

                  {
                    // (encounter.status === "discharged" ||
                    //   encounter.status === "completed") &&
                    encounter.hospitalization?.discharge_disposition && (
                      <Badge
                        title={t("discharge_disposition")}
                        variant="outline"
                        className="gap-1"
                      >
                        <CareIcon
                          icon="l-signout"
                          className="size-4 text-blue-400"
                        />
                        {t(
                          `encounter_discharge_disposition__${encounter.hospitalization.discharge_disposition}`,
                        )}
                      </Badge>
                    )
                  }

                  {canWrite ? (
                    <LinkDepartmentsSheet
                      entityType="encounter"
                      entityId={encounter.id}
                      currentOrganizations={encounter.organizations}
                      facilityId={encounter.facility.id}
                      trigger={
                        <div className="flex flex-wrap gap-2">
                          {encounter.organizations.map((org) =>
                            organizationBadge(org),
                          )}
                          {encounter.organizations.length === 0 && (
                            <Badge
                              className="capitalize gap-1 py-1 px-2 cursor-pointer hover:bg-secondary-100"
                              variant="outline"
                            >
                              <Building className="size-4 text-blue-400" />
                              Add Organizations
                            </Badge>
                          )}
                        </div>
                      }
                    />
                  ) : (
                    encounter.organizations.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {encounter.organizations.map((org) =>
                          organizationBadge(org),
                        )}
                      </div>
                    )
                  )}
                  {props.encounter.current_location ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <div>
                          <Badge
                            className="capitalize gap-1 py-1 px-2 cursor-pointer hover:bg-secondary-100"
                            variant="outline"
                            title={`Current Location: ${props.encounter.current_location.name}`}
                          >
                            <CareIcon
                              icon="l-location-point"
                              className="size-4 text-green-600"
                            />
                            {props.encounter.current_location.name}
                            <ChevronDown className="size-3 opacity-50" />
                          </Badge>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent align={"start"} className="w-auto p-2">
                        <div className="space-y-2 p-2 items-center">
                          <div className="flex items-center gap-8 justify-between">
                            <h4 className="font-medium text-sm">
                              {t("location")}
                            </h4>

                            <LocationSheet
                              facilityId={props.encounter.facility.id}
                              history={encounter.location_history}
                              encounter={encounter}
                              trigger={
                                <div>
                                  <CareIcon
                                    icon="l-history"
                                    className="size-4 text-gray-700"
                                  />
                                  <Button
                                    variant="link"
                                    className="text-gray-950 underline pl-1 pr-0  font-semibold"
                                  >
                                    {t("history")}
                                  </Button>
                                </div>
                              }
                            />
                          </div>
                          <div className="border-b border-gray-200 my-2" />
                          <LocationTree
                            location={props.encounter.current_location}
                          />
                          <div className="border-b border-dashed border-gray-200 my-2" />
                          {canWrite && (
                            <LocationSheet
                              facilityId={props.encounter.facility.id}
                              encounter={encounter}
                              trigger={
                                <Button
                                  variant="outline"
                                  className="border-gray-400 w-full"
                                >
                                  {t("update_location")}
                                </Button>
                              }
                              history={encounter.location_history}
                            />
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : canWrite ? (
                    <Badge variant="outline">
                      <LocationSheet
                        facilityId={props.encounter.facility.id}
                        encounter={encounter}
                        trigger={
                          <div className="flex items-center gap-1 text-gray-950 py-0.5 cursor-pointer hover:bg-secondary-100">
                            <CareIcon
                              icon="l-location-point"
                              className="size-4 text-green-600"
                            />
                            {t("add_location")}
                          </div>
                        }
                        history={encounter.location_history}
                      />
                    </Badge>
                  ) : (
                    <></>
                  )}
                  <Badge variant="outline">
                    <ConsentSheet
                      patientId={props.encounter.patient.id}
                      encounterId={props.encounter.id}
                      trigger={
                        <div className="flex items-center gap-1 text-gray-950 py-0.5 cursor-pointer hover:bg-secondary-100">
                          <SignatureIcon className="size-4 text-green-600" />
                          {t("manage_consents")}
                        </div>
                      }
                    />
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          className="flex flex-col items-center justify-end gap-4 px-4 py-1 2xl:flex-row"
          id="consultation-buttons"
        >
          {!disableButtons && (
            <div
              className="flex w-full flex-col gap-3 lg:w-auto 2xl:flex-row"
              data-cy="update-encounter-button"
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="primary">
                    {inactiveEncounterStatus.includes(encounter.status)
                      ? t("actions")
                      : t("update")}
                    <ChevronDown className="ml-2 size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <EncounterActions encounter={encounter} layout="dropdown" />
                  <PLUGIN_Component
                    __name="PatientInfoCardActions"
                    encounter={encounter}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </section>
    </>
  );

  function organizationBadge(org: FacilityOrganization) {
    return (
      <Badge
        key={org.id}
        className={cn(
          "capitalize gap-1 py-1 px-2 hover:bg-secondary-100 cursor-pointer",
        )}
        variant="outline"
        title={`Organization: ${org.name}${org.description ? ` - ${org.description}` : ""}`}
      >
        <Building className="size-4 text-blue-400" />
        {org.name}
      </Badge>
    );
  }
}
