import { Avatar } from "@/components/Common/Avatar";
import { PatientAddressLink } from "@/components/Patient/PatientAddressLink";
import { formatPatientAddress } from "@/components/Patient/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PatientRead } from "@/types/emr/patient/patient";
import { getTagHierarchyDisplay } from "@/types/emr/tagConfig/tagConfig";
import { formatPatientAge } from "@/Utils/utils";
import { Phone } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

export const PatientInfoHoverCard = ({
  patient,
  facilityId,
}: {
  patient: PatientRead;
  facilityId: string;
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex justify-between">
        <div className="flex items-center gap-4">
          <div className="size-12">
            <Avatar name={patient.name} />
          </div>
          <div className="flex flex-col">
            <h5 className="text-lg font-semibold">{patient.name}</h5>
            <span className="text-gray-700 text-sm font-medium">
              {formatPatientAge(patient, true)},{" "}
              {t(`GENDER__${patient.gender}`)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" className="text-gray-950" asChild>
          <Link
            basePath="/"
            href={`/facility/${facilityId}/patients/verify?${new URLSearchParams(
              {
                phone_number: patient.phone_number,
                year_of_birth: patient.year_of_birth.toString(),
                partial_id: patient.id.slice(0, 5),
              },
            ).toString()}`}
          >
            {t("patient_home")}
          </Link>
        </Button>
        <Button variant="outline" className="text-gray-950" asChild>
          <Link
            basePath="/"
            href={
              facilityId
                ? `/facility/${facilityId}/patient/${patient.id}`
                : `/patient/${patient.id}`
            }
          >
            {t("view_profile")}
          </Link>
        </Button>
      </div>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3 border-t border-gray-200 pt-4">
          {patient.instance_identifiers?.map((identifier) => (
            <div
              key={identifier.config.id}
              className="flex flex-col gap-0.5 text-sm"
            >
              <span className="font-medium text-gray-700">
                {identifier.config.config.display}:{" "}
              </span>
              <span className="font-semibold">{identifier.value}</span>
            </div>
          ))}
          {patient.phone_number && (
            <div className="flex flex-col gap-1 text-sm font-medium">
              <span className="text-gray-700">{t("contact")}</span>
              <a
                className="flex flex-row gap-2 items-center"
                href={`tel:${patient.phone_number}`}
              >
                <Phone size={14} strokeWidth={1.5} />
                <span className="text-gray-950">{patient.phone_number}</span>
              </a>
            </div>
          )}
          {patient.emergency_phone_number &&
            patient.phone_number !== patient.emergency_phone_number && (
              <div className="flex flex-col gap-1 text-sm font-medium">
                <span className="text-gray-700">{t("emergency_contact")}</span>

                <a
                  className="flex flex-row gap-2 items-center"
                  href={`tel:${patient.emergency_phone_number}`}
                >
                  <Phone size={14} strokeWidth={1.5} />
                  <span className="text-gray-950">
                    {patient.emergency_phone_number}
                  </span>
                </a>
              </div>
            )}
        </div>
        <div className="flex items-start border-t border-gray-200 pt-2">
          <div className="flex flex-col gap-1 text-sm font-medium w-full">
            <span className="text-gray-700">{t("location")}</span>
            <div className="flex items-end justify-between gap-2 w-full">
              <span className="text-gray-950 my-auto whitespace-break-spaces">
                {formatPatientAddress(patient.address) || (
                  <span className="text-gray-500">
                    {t("no_address_provided")}
                  </span>
                )}
              </span>
              <PatientAddressLink address={patient.address} />
            </div>
          </div>
        </div>
        {patient.instance_tags.length > 0 && (
          <div className="flex items-start border-t border-gray-200 pt-2">
            <div className="flex flex-col gap-1 text-sm font-medium w-full">
              <span className="text-gray-700">{t("patient_tags")}:</span>
              <div className="flex flex-wrap gap-2 text-sm whitespace-nowrap">
                <>
                  {patient.instance_tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="capitalize"
                      title={tag.description}
                    >
                      {getTagHierarchyDisplay(tag)}
                    </Badge>
                  ))}
                </>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
