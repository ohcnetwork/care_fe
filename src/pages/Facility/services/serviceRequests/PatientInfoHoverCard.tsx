import { Avatar } from "@/components/Common/Avatar";
import { Button } from "@/components/ui/button";
import { PatientRead } from "@/types/emr/patient/patient";
import { formatPatientAge } from "@/Utils/utils";
import { ExternalLink, Phone } from "lucide-react";
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
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const links = patient.address?.match(urlRegex);

  const addressText = patient.address?.replace(urlRegex, "").trim();

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
        <Button variant="outline" size="lg" className="text-gray-950" asChild>
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
      <div className="flex flex-col gap-4">
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
          <div className="flex flex-col gap-1 text-sm font-medium">
            <span className="text-gray-700">{t("emergency_contact")}</span>
            <div className="flex flex-row gap-2 items-center">
              <Phone size={14} strokeWidth={1.5} />
              <span className="text-gray-950">
                {patient.emergency_phone_number || patient.phone_number}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-start border-t border-gray-200 pt-2">
          <div className="flex flex-col gap-1 text-sm font-medium w-full">
            <span className="text-gray-700">{t("location")}</span>
            <div className="flex items-end justify-between gap-2 w-full">
              {addressText && (
                <span className="text-gray-950 my-auto whitespace-break-spaces">
                  {addressText}
                </span>
              )}
              {links && links.length > 0 && (
                <div className="flex flex-col">
                  {links.map((link) => (
                    <Link
                      href={link}
                      key={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex gap-1 items-center whitespace-nowrap"
                    >
                      <ExternalLink size={14} />
                      {t("view_on_map")}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
