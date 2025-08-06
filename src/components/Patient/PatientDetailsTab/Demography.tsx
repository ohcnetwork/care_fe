import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { navigate } from "raviger";
import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import { ClickableAddress } from "@/components/Common/ClickableAddress";
import { PatientProps } from "@/components/Patient/PatientDetailsTab";
import TagAssignmentSheet from "@/components/Tags/TagAssignmentSheet";

import { getPermissions } from "@/common/Permissions";
import { GENDER_TYPES } from "@/common/constants";

import { PLUGIN_Component } from "@/PluginEngine";
import { formatPatientAge } from "@/Utils/utils";
import { usePermissions } from "@/context/PermissionContext";
import { TagResource } from "@/types/emr/tagConfig/tagConfig";
import {
  Organization,
  OrganizationParent,
  getOrgLabel,
} from "@/types/organization/organization";

export const Demography = (props: PatientProps) => {
  const { patientData, facilityId } = props;
  const patientId = patientData.id;
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const { canWritePatient } = getPermissions(
    hasPermission,
    patientData.permissions,
  );

  const [activeSection, _setActiveSection] = useState<string | null>(null);
  const patientGender = GENDER_TYPES.find(
    (i) => i.id === patientData.gender,
  )?.text;

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView();
    }
  };

  const handleEditClick = (sectionId: string) => {
    if (sectionId === "tags") {
      navigate(`/patient/${patientId}/tags`);
      return;
    }
    if (sectionId === "general-info") {
      if (facilityId) {
        navigate(
          `/facility/${facilityId}/patient/${patientId}/update?section=${sectionId}`,
        );
      } else {
        navigate(`/patient/${patientId}/update?section=${sectionId}`);
      }
    }
  };

  const EmergencyContact = (props: { number?: string; name?: string }) => (
    <div className="sm:col-span-2">
      <div className="mr-6 flex flex-col items-start justify-between rounded-md border border-orange-300 bg-orange-50 p-4 sm:flex-row">
        {/* Emergency Contact Section */}
        <div className="flex-1">
          <div className="text-sm font-normal leading-5 text-gray-600">
            {t("emergency_contact")}
          </div>

          <div className="mt-1 text-sm leading-5 text-secondary-900">
            <div>
              <a
                href={`tel:${props.number}`}
                className="text-sm font-medium text-black hover:text-secondary-500"
              >
                {(props.number && formatPhoneNumberIntl(props.number)) || "-"}
              </a>
            </div>
            {props.number && (
              <div>
                <a
                  href={`https://wa.me/${props.number?.replace(/\D+/g, "")}`}
                  target="_blank"
                  className="text-sm font-normal text-sky-600 hover:text-sky-300"
                  rel="noreferrer"
                >
                  <CareIcon icon="l-whatsapp" /> {t("chat_on_whatsapp")}
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="ml-0 mt-4 flex-1 sm:ml-4 sm:mt-0">
          <div className="text-sm font-normal leading-5 text-gray-600">
            {t("emergency_contact_person_name")}
          </div>
          <div className="mt-1 text-sm font-semibold leading-5 text-gray-900">
            -
          </div>
        </div>
      </div>
    </div>
  );

  type Data = {
    id: string;
    hidden?: boolean;
    allowEdit?: boolean;
    editComponent?: React.ReactNode;
    details: (React.ReactNode | { label: string; value: React.ReactNode })[];
  };

  const getGeoOrgDetails = (geoOrg: Organization) => {
    const orgParents: OrganizationParent[] = [];
    let currentParent = geoOrg.parent;
    while (currentParent) {
      if (currentParent.id) {
        orgParents.push(currentParent);
      }
      currentParent = currentParent.parent;
    }

    const parentDetails = orgParents.map((org) => {
      return {
        label: getOrgLabel(org.org_type, org.metadata),
        value: org.name,
      };
    });

    return parentDetails.reverse().concat({
      label: getOrgLabel(geoOrg.org_type, geoOrg.metadata),
      value: geoOrg.name,
    });
  };

  const data: Data[] = [
    {
      id: "general-info",
      allowEdit: canWritePatient,
      details: [
        <PLUGIN_Component
          key="patient_details_tab__demography__general_info"
          __name="PatientDetailsTabDemographyGeneralInfo"
          facilityId={facilityId ?? ""}
          {...props}
        />,
        { label: t("full_name"), value: patientData.name },
        {
          label: t("phone_number"),
          value: (
            <div>
              <a
                href={`tel:${patientData.phone_number}`}
                className="text-sm font-medium text-black hover:text-secondary-500"
              >
                {patientData.phone_number &&
                  formatPhoneNumberIntl(patientData.phone_number)}
              </a>
              <br />
              <a
                href={`https://wa.me/${patientData.phone_number?.replace(/\D+/g, "")}`}
                target="_blank"
                className="text-sm font-normal text-sky-600 hover:text-sky-300"
                rel="noreferrer"
              >
                <CareIcon icon="l-whatsapp" /> {t("chat_on_whatsapp")}
              </a>
            </div>
          ),
        },
        {
          label: t(
            patientData.date_of_birth ? "date_of_birth" : "year_of_birth",
          ),
          value: patientData.date_of_birth ? (
            <>
              {dayjs(patientData.date_of_birth).format("DD MMM YYYY")} (
              {formatPatientAge(patientData, true)})
            </>
          ) : (
            <>
              {patientData.year_of_birth} ({formatPatientAge(patientData, true)}
              )
            </>
          ),
        },
        {
          label: t("sex"),
          value: patientGender,
        },
        <EmergencyContact
          key="emergency-contact"
          number={patientData.emergency_phone_number}
          name={patientData.name}
        />,
        {
          label: t("current_address"),
          value: <ClickableAddress address={patientData.address || ""} />,
        },
        {
          label: t("permanent_address"),
          value: (
            <ClickableAddress address={patientData.permanent_address || ""} />
          ),
        },
        ...getGeoOrgDetails(patientData.geo_organization),
      ],
    },
    {
      id: "identifiers",
      allowEdit: false,
      details: patientData.instance_identifiers?.map((i) => ({
        label: i.config.config.display,
        value: i.value,
      })),
    },
    {
      id: "tags",
      allowEdit: canWritePatient,
      editComponent: (
        <TagAssignmentSheet
          entityType={TagResource.PATIENT}
          entityId={patientId}
          currentTags={patientData.instance_tags}
          onUpdate={() => {
            queryClient.invalidateQueries({
              queryKey: ["patient", patientId],
            });
          }}
          canWrite={canWritePatient}
        />
      ),
      details: patientData.instance_tags.map((t) => ({
        label: t.parent ? t.parent.display : t.display,
        value: t.display,
      })),
    },
  ];

  return (
    <div>
      <section
        className="mt-8 w-full items-start gap-6 px-3 md:px-0 lg:flex 2xl:gap-8"
        data-testid="patient-details"
      >
        <div className="sticky top-20 hidden text-sm font-medium text-gray-600 lg:flex lg:basis-1/5 lg:flex-col gap-2">
          {data
            .filter((s) => !s.hidden)
            .map((subtab, i) => (
              <button
                key={i}
                className={`cursor-pointer rounded-lg p-3 transition-colors duration-300 text-left ${
                  activeSection === subtab.id
                    ? "bg-white text-green-800"
                    : "hover:bg-white hover:text-green-800"
                }`}
                onClick={() => scrollToSection(subtab.id)}
              >
                {t(`patient__${subtab.id}`)}
              </button>
            ))}
        </div>

        <div className="lg:basis-4/5">
          {/* <div className="mt-4 rounded-md border border-blue-400 bg-blue-50 p-5 grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2 md:gap-y-8 lg:grid-cols-2">
            {[
              { label: t("abha_number"), value: "-" },
              { label: t("abha_address"), value: "-" },
            ].map((info, i) => (
              <div className="sm:col-span-1" key={i}>
                <p className="text-normal text-sm text-gray-600 sm:col-span-1">
                  {info.label}:
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {info.value}
                </p>
              </div>
            ))}
          </div> */}
          <div className="flex h-full flex-col gap-y-4">
            {data
              .filter((s) => !s.hidden)
              .map((subtab, i) => (
                <div
                  key={i}
                  id={subtab.id}
                  className="group mt-4 rounded-md bg-white pb-2 pl-5 pt-5 shadow-sm"
                >
                  <hr className="mb-1 mr-5 h-1 w-5 border-0 bg-blue-500" />
                  <div className="flex flex-row items-center justify-between gap-x-4 mb-4 mr-4">
                    <h1 className="text-xl">{t(`patient__${subtab.id}`)}</h1>
                    {subtab.allowEdit &&
                      (subtab.editComponent ? (
                        subtab.editComponent
                      ) : (
                        <Button
                          data-cy="edit-patient-button"
                          variant="outline"
                          disabled={false}
                          onClick={() => handleEditClick(subtab.id)}
                        >
                          <CareIcon
                            icon="l-edit-alt"
                            className="text-md pr-1"
                          />
                          {t("edit")}
                        </Button>
                      ))}
                  </div>
                  <div className="mb-8 mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 md:gap-y-8">
                    {subtab.details.map((detail, j) =>
                      detail &&
                      typeof detail === "object" &&
                      "label" in detail ? (
                        <div className="sm:col-span-1" key={j}>
                          <div className="text-sm font-normal leading-5 text-gray-500">
                            {detail.label}
                          </div>
                          <div className="mt-1 text-sm font-semibold leading-5 text-gray-900">
                            {detail.value || "-"}
                          </div>
                        </div>
                      ) : (
                        <Fragment key={j}>{detail}</Fragment>
                      ),
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
};
