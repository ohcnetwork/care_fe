import { Avatar } from "@/components/Common/Avatar";
import { Button } from "@/components/ui/button";
import { PatientRead } from "@/types/emr/patient/patient";
import { formatPatientAge } from "@/Utils/utils";
import { MapPin, Phone } from "lucide-react";
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
        <div className="flex justify-between border-t border-gray-200 pt-4">
          <div className="flex flex-col gap-1 text-sm font-medium">
            <span className="text-gray-700">{t("hospital_identifier")}</span>
            <span className="text-gray-950">--</span>
            {/* TODO: Add hospital identifier */}
          </div>
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
          <div className="flex flex-col gap-1 text-sm font-medium">
            <span className="text-gray-700">{t("location")}</span>
            <div className="flex flex-row gap-1 items-center justify-items-center bg-indigo-50 text-blue-700 rounded-sm py-1 px-2 underline text-sm font-medium">
              <div>
                <MapPin size={14} />
              </div>
              <span>{patient.address || patient.permanent_address}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
