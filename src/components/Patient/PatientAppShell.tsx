import careConfig from "@careConfig";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  FolderClosed,
  Home,
  User,
} from "lucide-react";
import { Link, navigate, usePath } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Avatar } from "@/components/Common/Avatar";
import { PatientSwitcherSheet } from "@/components/Patient/PatientSwitcherSheet";

import { usePatientContext } from "@/hooks/usePatientUser";

/** How long the "now showing records for X" confirmation stays up. */
const SWITCH_NOTICE_MS = 4000;

const TABS = [
  { key: "home", href: "/patient/home", icon: Home, label: "home" },
  {
    key: "visits",
    href: "/patient/visits",
    icon: CalendarDays,
    label: "visits",
  },
  {
    key: "records",
    href: "/patient/records",
    icon: FolderClosed,
    label: "records",
  },
  { key: "profile", href: "/patient/profile", icon: User, label: "profile" },
] as const;

/** `Anitha Ravindran` → `Anitha R.` so the header chip stays on one line. */
function abbreviateName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) {
    return parts[0] ?? "";
  }
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

interface PatientAppShellProps {
  children: React.ReactNode;
  /**
   * Omit on the home screen to get the large "Viewing <patient>" chip.
   * Provide it elsewhere to get a page title alongside a compact chip.
   */
  title?: string;
  /** Renders a back affordance instead of the tab bar's implicit navigation. */
  backTo?: string;
  /** Detail screens hide the tab bar so the page owns the full height. */
  hideTabs?: boolean;
  /** Trailing header content, e.g. a download action on detail screens. */
  headerAction?: React.ReactNode;
  /** Underline tabs rendered inside the header — use `PatientHeaderTabs`. */
  headerTabs?: React.ReactNode;
}

/**
 * The section switcher used by Records and Visits. Lives here so both screens
 * share one implementation and stay visually identical.
 */
export function PatientHeaderTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="flex gap-6 px-4">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          aria-current={value === tab.key ? "page" : undefined}
          className={cn(
            "-mb-px border-b-[2.5px] pb-2.5 text-[14.5px] transition-colors",
            value === tab.key
              ? "border-primary-700 font-bold text-primary-700"
              : "border-transparent font-semibold text-gray-600 hover:text-gray-900",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function PatientAppShell({
  children,
  title,
  backTo,
  hideTabs,
  headerAction,
  headerTabs,
}: PatientAppShellProps) {
  const { t } = useTranslation();
  const path = usePath();
  const { selectedPatient, patients, isLoadingPatients } = usePatientContext();

  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [switchedTo, setSwitchedTo] = useState<string | null>(null);

  // Every patient screen is scoped to a profile, so with none linked the only
  // useful destination is the picker, which offers to create one.
  const hasNoProfiles = !isLoadingPatients && patients?.length === 0;
  useEffect(() => {
    if (hasNoProfiles) {
      navigate("/patient/select-profile", { replace: true });
    }
  }, [hasNoProfiles]);

  useEffect(() => {
    if (!switchedTo) {
      return;
    }
    const timer = setTimeout(() => setSwitchedTo(null), SWITCH_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [switchedTo]);

  const canSwitch = (patients?.length ?? 0) > 1;

  const switcherChip = selectedPatient && (
    <button
      type="button"
      onClick={() => setSwitcherOpen(true)}
      disabled={!canSwitch}
      className={cn(
        "flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 py-1 pl-1 pr-3",
        canSwitch && "hover:border-gray-300",
      )}
    >
      <Avatar
        name={selectedPatient.name}
        className={cn("rounded-full", title ? "size-6" : "size-7")}
      />
      {title ? (
        <span className="text-[13px] font-semibold text-gray-900">
          {abbreviateName(selectedPatient.name)}
        </span>
      ) : (
        <span className="flex flex-col items-start leading-tight">
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-gray-500">
            {t("patient_shell__viewing")}
          </span>
          <span className="text-sm font-bold text-gray-900">
            {abbreviateName(selectedPatient.name)}
          </span>
        </span>
      )}
      {canSwitch && <ChevronDown className="size-3.5 text-gray-500" />}
    </button>
  );

  const tabBar = (
    <>
      {TABS.map((tab) => {
        const isActive = path?.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-1 transition-colors",
              isActive
                ? "text-primary-700"
                : "text-gray-400 hover:text-gray-600",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="size-5" strokeWidth={1.9} />
            <span
              className={cn(
                "text-[10.5px]",
                isActive ? "font-bold" : "font-semibold",
              )}
            >
              {t(tab.label)}
            </span>
          </Link>
        );
      })}
    </>
  );

  // One layout at every width: the same mobile-first column, centred on wider
  // screens. No separate desktop navigation to keep in sync.
  return (
    <div className="flex min-h-dvh bg-gray-100">
      {/* min-w-0 throughout: without it these flex items refuse to shrink
          below their content's min-content width, and one long record title
          makes the whole page scroll sideways. */}
      <div className="flex min-w-0 flex-1 justify-center">
        <div className="flex w-full min-w-0 max-w-[480px] flex-col bg-gray-50 sm:my-4 sm:min-h-0 sm:rounded-3xl sm:border sm:border-gray-200 sm:shadow-sm">
          <header className="sticky top-0 z-10 shrink-0 border-b border-gray-200 bg-white sm:rounded-t-3xl">
            <div className="flex min-w-0 items-center gap-2.5 px-4 py-3">
              {backTo && (
                <button
                  type="button"
                  onClick={() => navigate(backTo)}
                  aria-label={t("back")}
                  className="-ml-1 flex size-8 items-center justify-center rounded-lg text-gray-900 hover:bg-gray-100"
                >
                  <ArrowLeft className="size-5" strokeWidth={1.9} />
                </button>
              )}
              {/* One header variant: the logo stands in for the title, so it
                  only appears where there isn't one — the home screen. */}
              {title ? (
                <h1 className="min-w-0 truncate text-xl font-bold tracking-tight text-gray-900">
                  {title}
                </h1>
              ) : (
                <Link href="/patient/home" aria-label={t("care")}>
                  <img
                    src={careConfig.mainLogo?.dark}
                    alt={t("care")}
                    className="h-7 w-auto shrink-0"
                  />
                </Link>
              )}
              <div className="ml-auto flex items-center gap-2">
                {headerAction}
                {!hideTabs && switcherChip}
              </div>
            </div>
            {headerTabs}
          </header>

          {switchedTo && (
            <div className="mx-4 mt-3 flex items-center gap-2.5 rounded-xl border border-primary-200 bg-primary-50 px-3.5 py-2.5">
              <Check className="size-4 text-primary-700" strokeWidth={2.4} />
              <span className="text-[12.5px] font-semibold text-primary-800">
                {t("patient_shell__now_showing", { name: switchedTo })}
              </span>
            </div>
          )}

          <main className="flex min-w-0 flex-1 flex-col">{children}</main>

          {!hideTabs && (
            <nav
              aria-label={t("patient_shell__navigation")}
              className="sticky bottom-0 grid shrink-0 grid-cols-4 border-t border-gray-200 bg-white px-2 pb-5 pt-2 sm:rounded-b-3xl sm:pb-2"
            >
              {tabBar}
            </nav>
          )}
        </div>
      </div>

      <PatientSwitcherSheet
        open={switcherOpen}
        onOpenChange={setSwitcherOpen}
        onSwitched={(patient) => setSwitchedTo(patient.name)}
      />
    </div>
  );
}
