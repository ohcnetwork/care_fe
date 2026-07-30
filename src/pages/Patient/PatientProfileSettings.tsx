import careConfig from "@careConfig";
import { Check, Plus } from "lucide-react";
import { Link, navigate } from "raviger";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { Avatar } from "@/components/Common/Avatar";
import LanguageSelector from "@/components/Common/LanguageSelector";
import { PatientAppShell } from "@/components/Patient/PatientAppShell";
import { patientMetaLine } from "@/components/Patient/PatientProfileCard";

import { useAuthContext } from "@/hooks/useAuthUser";
import { usePatientContext } from "@/hooks/usePatientUser";

/**
 * The account is the mobile number; each patient is a profile under it. This
 * screen shows that relationship and lets the patient switch which profile is
 * active, add another, change language, or sign out.
 */
export default function PatientProfileSettings() {
  const { t } = useTranslation();
  const { signOut } = useAuthContext();
  const {
    patients,
    selectedPatient,
    setSelectedPatient,
    isLoadingPatients,
    tokenData,
  } = usePatientContext();

  return (
    <PatientAppShell title={t("profile")}>
      <div className="flex flex-col gap-4 p-4">
        {/* The account itself has no name or editable fields — it is the number. */}
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-700 text-sm font-bold text-white">
            {tokenData?.phoneNumber?.slice(-2) ?? "--"}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-bold text-gray-900">
              {tokenData?.phoneNumber
                ? formatPhoneNumberIntl(tokenData.phoneNumber)
                : "-"}
            </span>
            <span className="truncate text-[12.5px] text-gray-600">
              {t("patient_profile__account_description")}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            {t("patient_profile__patients_on_this_number")} ·{" "}
            {patients?.length ?? 0}
          </span>

          {isLoadingPatients ? (
            <Skeleton className="h-20 w-full rounded-2xl" />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {patients?.map((patient, index) => {
                const isActive = patient.id === selectedPatient?.id;
                return (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => setSelectedPatient(patient)}
                    aria-pressed={isActive}
                    className={cn(
                      "flex w-full items-center gap-3 p-3.5 text-left hover:bg-gray-50",
                      index > 0 && "border-t border-gray-100",
                    )}
                  >
                    <Avatar
                      name={patient.name}
                      className="size-9 shrink-0 rounded-full"
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[14.5px] font-semibold text-gray-900">
                        {patient.name}
                      </span>
                      <span className="truncate text-xs text-gray-600">
                        {patientMetaLine(patient, t)}
                      </span>
                    </div>
                    {isActive ? (
                      <Badge variant="green" className="shrink-0">
                        <Check className="size-3" strokeWidth={3} />
                        {t("active")}
                      </Badge>
                    ) : (
                      <span className="shrink-0 text-[13px] font-semibold text-primary-700">
                        {t("switch")}
                      </span>
                    )}
                  </button>
                );
              })}
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

        <div className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-3.5">
          <span className="text-[13px] font-semibold text-gray-900">
            {t("language")}
          </span>
          <LanguageSelector />
        </div>

        <button
          type="button"
          onClick={async () => {
            // signOut() lands on the staff /login; a patient belongs on theirs.
            await signOut();
            navigate("/patient/login", { replace: true });
          }}
          className="mt-2 py-2 text-center text-sm font-bold text-red-600 hover:underline"
        >
          {t("sign_out")}
        </button>

        {careConfig.customDescription && (
          <p className="text-center text-[11.5px] text-gray-400">
            {careConfig.customDescription}
          </p>
        )}
      </div>
    </PatientAppShell>
  );
}
