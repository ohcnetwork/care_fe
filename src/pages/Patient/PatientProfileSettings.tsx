import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import careConfig from "@careConfig";
import { Languages, LogOut, Plus } from "lucide-react";
import { Link, navigate } from "raviger";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import LanguageSelector from "@/components/Common/LanguageSelector";
import { PatientAppShell } from "@/components/Patient/PatientAppShell";
import {
  patientInitials,
  PatientProfileCard,
} from "@/components/Patient/PatientProfileCard";

import { useAppVersion } from "@/hooks/useAppVersion";
import { useAuthContext } from "@/hooks/useAuthUser";
import { usePatientContext } from "@/hooks/usePatientUser";

export default function PatientProfileSettings() {
  const { t } = useTranslation();
  const { signOut } = useAuthContext();
  const { versionInfo } = useAppVersion();
  const {
    patients,
    selectedPatient,
    setSelectedPatient,
    isLoadingPatients,
    tokenData,
  } = usePatientContext();

  const owner =
    patients?.find(
      (patient) => patient.phone_number === tokenData?.phoneNumber,
    ) ?? patients?.[0];

  const footerNote = [
    versionInfo?.version && `v${versionInfo.version.slice(0, 8)}`,
    careConfig.customDescription,
  ]
    .filter(Boolean)
    .join(" · ");
  const handleSignOut = async () => {
    await signOut();
    navigate("/patient/login", { replace: true });
  };

  return (
    <PatientAppShell title={t("profile")}>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-700 text-sm font-bold text-white">
            {owner ? patientInitials(owner.name) : "-"}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-bold text-gray-900">
              {owner?.name ??
                (tokenData?.phoneNumber
                  ? formatPhoneNumberIntl(tokenData.phoneNumber)
                  : "-")}
            </span>
            <span className="truncate text-xs text-gray-600">
              {[
                tokenData?.phoneNumber &&
                  formatPhoneNumberIntl(tokenData.phoneNumber),
                t("patient_profile__account_owner"),
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleSignOut}
            aria-label={t("sign_out")}
            className="ml-auto flex size-9 shrink-0 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="size-5" strokeWidth={1.9} />
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.09em] text-gray-500">
            {t("patient_profile__patients_on_this_number")} ·{" "}
            {patients?.length ?? 0}
          </span>

          {isLoadingPatients ? (
            <Skeleton className="h-20 w-full rounded-2xl" />
          ) : (
            <div className="flex flex-col gap-2.5">
              {patients?.map((patient) => (
                <PatientProfileCard
                  key={patient.id}
                  patient={patient}
                  selected={patient.id === selectedPatient?.id}
                  onSelect={setSelectedPatient}
                />
              ))}
            </div>
          )}

          <Link
            href="/patient/add-profile"
            className="flex items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-gray-300 p-3.5 text-sm font-semibold text-primary-700 hover:border-primary-700 hover:bg-primary-50"
          >
            <Plus className="size-4" strokeWidth={2.2} />
            {t("patient_select__add_family_member")}
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="flex min-h-11 items-center gap-3 px-4 py-2.5">
            <Languages
              className="size-4.5 shrink-0 text-gray-900"
              strokeWidth={1.8}
            />
            <span className="flex-1 text-sm text-gray-900">
              {t("language")}
            </span>
            <div className="shrink-0  **:data-[slot=select-trigger]:border-0 **:data-[slot=select-trigger]:shadow-none">
              <LanguageSelector />
            </div>
          </div>
        </div>

        <div className="mt-auto flex flex-col items-center gap-1.5 pt-4">
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-2 py-2 text-center text-sm font-bold text-red-600 hover:underline"
          >
            {t("sign_out")}
          </button>

          {footerNote && (
            <span className="text-[11px] text-gray-400">{footerNote}</span>
          )}
        </div>
      </div>
    </PatientAppShell>
  );
}
