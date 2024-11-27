import dayjs from "dayjs";
import { navigate } from "raviger";
import { Fragment, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Chip from "@/CAREUI/display/Chip";
import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";

import useAuthUser from "@/hooks/useAuthUser";

import { GENDER_TYPES } from "@/common/constants";

import { NonReadOnlyUsers } from "@/Utils/AuthorizeFor";
import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import { formatName, formatPatientAge } from "@/Utils/utils";

import { PatientProps } from ".";
import * as Notification from "../../../Utils/Notifications";
import { InsuranceDetailsCard } from "../InsuranceDetailsCard";
import { parseOccupation } from "../PatientHome";
import { AssignedToObjectModel } from "../models";

export const Demography = (props: PatientProps) => {
  const { patientData, facilityId, id } = props;
  const authUser = useAuthUser();
  const { t } = useTranslation();
  const [_assignedVolunteerObject, setAssignedVolunteerObject] =
    useState<AssignedToObjectModel>();

  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    setAssignedVolunteerObject(patientData.assigned_to_object);

    const observedSections: Element[] = [];
    const sections = document.querySelectorAll("div[id]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        threshold: 0.6,
      },
    );

    sections.forEach((section) => {
      observer.observe(section);
      observedSections.push(section);
    });

    return () => {
      observedSections.forEach((section) => observer.unobserve(section));
    };
  }, [patientData.assigned_to_object]);

  const { data: insuranceDetials } = useQuery(routes.hcx.policies.list, {
    query: {
      patient: id,
    },
  });

  const patientGender = GENDER_TYPES.find(
    (i) => i.id === patientData.gender,
  )?.text;

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleEditClick = (sectionId: string) => {
    navigate(
      `/facility/${facilityId}/patient/${id}/update?section=${sectionId}`,
    );
  };

  const hasEditPermission = () => {
    const showAllFacilityUsers = ["DistrictAdmin", "StateAdmin"];
    if (
      !showAllFacilityUsers.includes(authUser.user_type) &&
      authUser.home_facility_object?.id !== patientData.facility
    ) {
      Notification.Error({
        msg: "Oops! Non-Home facility users don't have permission to perform this action.",
      });
      return false;
    }
    return true;
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
                {props.number || "-"}
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
            {props.name || "-"}
          </div>
        </div>
      </div>
    </div>
  );

  const withPermissionCheck = (action: () => void) => () => {
    if (!hasEditPermission()) {
      Notification.Error({
        msg: t("permission_denied"),
      });
      return;
    }
    action();
  };

  type Data = {
    id: string;
    hidden?: boolean;
    allowEdit?: boolean;
    details: (React.ReactNode | { label: string; value: React.ReactNode })[];
  };

  const data: Data[] = [
    {
      id: "general-info",
      allowEdit: true,
      details: [
        { label: t("full_name"), value: patientData.name },
        {
          label: t("phone_number"),
          value: (
            <div>
              <a
                href={`tel:${patientData.phone_number}`}
                className="text-sm font-medium text-black hover:text-secondary-500"
              >
                {patientData.phone_number || "-"}
              </a>
              <br />
              <a
                href={`https://wa.me/${patientData.phone_number?.replace(/\D+/g, "")}`}
                target="_blank"
                className="text-sm font-normal text-sky-600 hover:text-sky-300"
                rel="noreferrer"
              >
                <CareIcon icon="l-whatsapp" /> Chat on WhatsApp
              </a>
            </div>
          ),
        },
        {
          label: t("date_of_birth"),
          value: (
            <>
              {dayjs(patientData.date_of_birth).format("DD MMM YYYY")} (
              {formatPatientAge(patientData, true)})
            </>
          ),
        },
        {
          label: t("sex"),
          value: patientGender,
        },
        <EmergencyContact
          number={patientData.emergency_phone_number}
          name={patientData.name}
        />,
        {
          label: t("current_address"),
          value: patientData.address,
        },
        {
          label: t("permanent_address"),
          value: patientData.permanent_address,
        },
        {
          label: t("nationality"),
          value: patientData.nationality,
        },
        {
          label: t("state"),
          value: patientData.state,
        },
        {
          label: t("district"),
          value: patientData.district_object?.name,
        },
        {
          label: t("local_body"),
          value: patientData.local_body_object?.name,
        },
        {
          label: t("ward"),
          value: (
            <>
              {(patientData.ward_object &&
                patientData.ward_object.number +
                  ", " +
                  patientData.ward_object.name) ||
                "-"}
            </>
          ),
        },
        {
          label: t("village"),
          value: patientData.village,
        },
      ],
    },
    {
      id: "social-profile",
      allowEdit: true,
      details: [
        {
          label: t("occupation"),
          value: parseOccupation(patientData.meta_info?.occupation),
        },
        {
          label: t("ration_card_category"),
          value:
            !!patientData.ration_card_category &&
            t(`ration_card__${patientData.ration_card_category}`),
        },
        {
          label: t("socioeconomic_status"),
          value:
            patientData.meta_info?.socioeconomic_status &&
            t(
              `SOCIOECONOMIC_STATUS__${patientData.meta_info?.socioeconomic_status}`,
            ),
        },
        {
          label: t("domestic_healthcare_support"),
          value:
            patientData.meta_info?.domestic_healthcare_support &&
            t(
              `DOMESTIC_HEALTHCARE_SUPPORT__${patientData.meta_info?.domestic_healthcare_support}`,
            ),
        },
      ],
    },
    {
      id: "volunteer-contact",
      hidden: !patientData.assigned_to_object,
      details: [
        <EmergencyContact
          number={patientData.assigned_to_object?.alt_phone_number}
          name={
            patientData.assigned_to_object
              ? formatName(patientData.assigned_to_object)
              : undefined
          }
        />,
      ],
    },
    {
      id: "insurance-details",
      details: [
        <div className="w-full md:col-span-2">
          {insuranceDetials?.results.map((insurance) => (
            <InsuranceDetailsCard key={insurance.id} data={insurance} />
          ))}
          {!!insuranceDetials?.results &&
            insuranceDetials.results.length === 0 && (
              <div className="text-gray-500 text-sm flex items-center justify-center py-10">
                {t("no_data_found")}
              </div>
            )}
          <ButtonV2
            border
            className="mt-4"
            ghost
            disabled={!patientData.is_active}
            onClick={withPermissionCheck(() =>
              handleEditClick("insurance-details"),
            )}
          >
            <CareIcon icon="l-plus" className="" />
            {t("add_insurance_details")}
          </ButtonV2>
        </div>,
      ],
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
          <div className="mb-2 flex flex-row justify-between">
            <div className="w-1/2">
              <div className="text-sm font-normal leading-5 text-secondary-700">
                {t("patient_status")}
              </div>
              <div className="mt-1 text-xl font-semibold leading-5 text-secondary-900">
                <Chip
                  size="medium"
                  variant="custom"
                  className={
                    patientData.is_active
                      ? "bg-blue-100 text-blue-800"
                      : "bg-red-100 text-red-800"
                  }
                  text={patientData.is_active ? "LIVE" : "DISCHARGED"}
                />
              </div>
            </div>
            <div>
              <ButtonV2
                id="update-patient-details"
                variant="secondary"
                className="mt-4  text-green-800 "
                disabled={!patientData.is_active}
                authorizeFor={NonReadOnlyUsers}
                onClick={withPermissionCheck(() =>
                  navigate(
                    `/facility/${patientData?.facility}/patient/${id}/update`,
                  ),
                )}
              >
                <CareIcon icon="l-edit-alt" className="text-lg" />
                {t("edit_profile")}
              </ButtonV2>
            </div>
          </div>
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
                  className="group mt-4 rounded-md bg-white pb-2 pl-5 pt-5 shadow"
                >
                  <hr className="mb-1 mr-5 h-1 w-5 border-0 bg-blue-500" />
                  <div className="flex flex-row gap-x-4 mb-4">
                    <h1 className="text-xl">{t(`patient__${subtab.id}`)}</h1>
                    {subtab.allowEdit && (
                      <button
                        className="flex rounded border border-secondary-400 bg-white px-2 py-1 text-sm font-semibold text-green-800 hover:bg-secondary-200"
                        disabled={!patientData.is_active}
                        onClick={withPermissionCheck(() =>
                          handleEditClick(subtab.id),
                        )}
                      >
                        <CareIcon
                          icon="l-edit-alt"
                          className="text-md mr-1 mt-1"
                        />
                        {t("edit")}
                      </button>
                    )}
                  </div>
                  <div className="mb-8 mt-2 grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2 md:gap-y-8 lg:grid-cols-2">
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
