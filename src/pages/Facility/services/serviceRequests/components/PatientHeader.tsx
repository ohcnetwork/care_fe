import { navigate } from "raviger";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import CareIcon from "@/CAREUI/icons/CareIcon";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useIsMobile } from "@/hooks/use-mobile";

import dayjs from "@/Utils/dayjs";
import { formatPatientAge } from "@/Utils/utils";
import { PatientRead } from "@/types/emr/patient/patient";

interface PatientHeaderProps {
  patient: PatientRead;
  facilityId: string;
  encounterId?: string;
}

export function PatientHeader({
  patient,
  facilityId,
  encounterId,
}: PatientHeaderProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const formatDateOfBirthAge = () => {
    if (patient.date_of_birth) {
      const formattedDate = dayjs(patient.date_of_birth).format("DD/MM/YYYY");
      const age = formatPatientAge(patient, true);
      return `${formattedDate} (${age})`;
    }
    return formatPatientAge(patient, true);
  };

  if (isMobile) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <div className="rounded-lg border border-gray-400 px-4 py-1 flex items-center justify-between cursor-pointer bg-white">
            <span className="font-semibold text-gray-950 text-base flex items-center gap-2">
              {patient.name}
              <CareIcon
                icon="l-angle-down"
                className="size-5 opacity-40 transition-transform group-active:translate-x-1"
              />
            </span>
          </div>
        </DialogTrigger>
        <DialogContent className="p-0 max-w-sm w-full rounded-t-2xl fixed bottom-0 left-1/2 -translate-x-1/2 m-0 shadow-2xl bg-white border-none animate-slide-up">
          {/* Drag handle */}
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-2" />
          <div className="px-6 pb-6 pt-2 flex flex-col gap-4">
            <DialogTitle className="flex items-center gap-2 justify-center text-lg font-bold text-gray-900 mb-2">
              <div
                onClick={() => {
                  const url = encounterId
                    ? `/facility/${facilityId}/patient/${patient.id}/encounter/${encounterId}/updates`
                    : `/facility/${facilityId}/patient/${patient.id}`;
                  navigate(url);
                }}
                className="hover:underline cursor-pointer"
              >
                {patient.name}
                <CareIcon
                  icon="l-external-link-alt"
                  className="ml-1 size-4 opacity-50"
                />
              </div>
            </DialogTitle>
            <div className="flex flex-col gap-3 divide-y divide-gray-100">
              <div className="flex items-center gap-3 py-2">
                <CareIcon
                  icon="l-calendar-alt"
                  className="size-5 text-primary-500 opacity-70"
                />
                <div>
                  <div className="text-gray-500 text-xs">
                    {t("date_of_birth_age")}
                  </div>
                  <div className="text-gray-950 font-semibold text-sm">
                    {formatDateOfBirthAge()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <CareIcon
                  icon="l-user"
                  className="size-5 text-primary-500 opacity-70"
                />
                <div>
                  <div className="text-gray-500 text-xs">{t("sex")}</div>
                  <div className="text-gray-950 font-semibold text-sm">
                    {t(patient.gender)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <CareIcon
                  icon="l-phone"
                  className="size-5 text-primary-500 opacity-70"
                />
                <div>
                  <div className="text-gray-500 text-xs">{t("phone")}</div>
                  <div className="text-gray-950 font-semibold text-sm">
                    {patient.phone_number &&
                      formatPhoneNumberIntl(patient.phone_number)}
                  </div>
                </div>
              </div>
            </div>
            <DialogClose asChild>
              <button className="mt-4 w-full py-2 rounded-full bg-primary-100 hover:bg-primary-200 text-primary-900 font-semibold shadow transition-colors text-base">
                {t("close")}
              </button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-8 justify-start flex-wrap">
        <div className="flex flex-col">
          <div className="text-gray-600 text-sm font-medium">
            {t("patient_name")}
          </div>
          <div className="text-gray-950 font-semibold underline underline-offset-2 flex items-center gap-1">
            <div
              className="text-base font-semibold hover:underline cursor-pointer text-gray-950"
              onClick={() => {
                const url = encounterId
                  ? `/facility/${facilityId}/patient/${patient.id}/encounter/${encounterId}/updates`
                  : `/facility/${facilityId}/patient/${patient.id}`;
                navigate(url);
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
