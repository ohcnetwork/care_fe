import { navigate } from "raviger";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import CareIcon from "@/CAREUI/icons/CareIcon";

import dayjs from "@/Utils/dayjs";
import { formatPatientAge } from "@/Utils/utils";
import { Patient } from "@/types/emr/patient/patient";

interface PatientHeaderProps {
  patient: Patient;
  facilityId: string;
}

export function PatientHeader({ patient, facilityId }: PatientHeaderProps) {
  const { t } = useTranslation();

  const formatDateOfBirthAge = () => {
    if (patient.date_of_birth) {
      const formattedDate = dayjs(patient.date_of_birth).format("DD/MM/YYYY");
      const age = formatPatientAge(patient, true);
      return `${formattedDate} (${age})`;
    }
    return formatPatientAge(patient, true);
  };

  return (
    <div>
      <div className="flex items-center gap-8 justify-start flex-wrap">
        <div className="flex flex-col">
          <div className="text-gray-600 text-sm font-medium">
            {t("patient") + " " + t("name")}
          </div>
          <div className="text-gray-950 font-semibold underline underline-offset-2 flex items-center gap-1">
            <div
              className="text-base font-semibold hover:underline cursor-pointer text-gray-950"
              onClick={() => {
                navigate(`/facility/${facilityId}/patient/${patient.id}`);
              }}
            >
              {patient.name}
            </div>
            <CareIcon
              icon="l-external-link-alt"
              className="size-4 opacity-50"
            />
          </div>
        </div>
        <div className="text-sm flex flex-col">
          <div className="text-gray-600">{t("uhid")}</div>
          <div className="text-gray-950 font-semibold">{patient.id}</div>
        </div>
        <div className="text-sm flex flex-col">
          <div className="text-gray-600">{t("date_of_birth_age")}</div>
          <div className="text-gray-950 font-semibold">
            {formatDateOfBirthAge()}
          </div>
        </div>
        <div className="text-sm flex flex-col">
          <div className="text-gray-600">{t("sex")}</div>
          <div className="text-gray-950 font-semibold">{t(patient.gender)}</div>
        </div>
        <div className="text-sm flex flex-col">
          <div className="text-gray-600">{t("phone")}</div>
          <div className="text-gray-950 font-semibold">
            {patient.phone_number &&
              formatPhoneNumberIntl(patient.phone_number)}
          </div>
        </div>
      </div>
    </div>
  );
}
