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

import { PatientAvatar } from "@/components/Patient/PatientProfileCard";
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
            "-mb-px flex min-h-11 items-center border-b-[2.5px] pb-2.5 text-sm transition-colors",
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
        "relative flex items-center rounded-full border border-gray-200 bg-gray-50",
        // The compact pill is 36px by design; the pseudo-element restores a
        // 44px hit area without stretching the visible chip.
        "after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
        title
          ? "min-h-9 gap-2 py-[5px] pl-[5px] pr-[11px]"
          : "min-h-11 gap-[9px] py-1.5 pl-1.5 pr-3",
        canSwitch && "hover:border-gray-300",
      )}
    >
      <PatientAvatar
        name={selectedPatient.name}
        active
        className={title ? "size-[26px] text-[10px]" : "size-[30px] text-xs"}
      />
      {title ? (
        <span className="text-sm font-semibold text-gray-900">
          {abbreviateName(selectedPatient.name)}
        </span>
      ) : (
        <span className="flex flex-col items-start leading-tight">
          <span className="text-[10px] font-bold uppercase tracking-[0.09em] text-gray-500">
            {t("patient_shell__viewing")}
          </span>
          <span className="text-sm font-bold text-gray-900">
            {abbreviateName(selectedPatient.name)}
          </span>
        </span>
      )}
      {canSwitch && (
        <ChevronDown
          className={cn("text-gray-600", title ? "size-3.5" : "size-[15px]")}
          strokeWidth={2.2}
        />
      )}
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
            <Icon className="size-[21px]" strokeWidth={1.9} />
            <span
              className={cn(
                "text-[10px]",
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

  // Desktop navigation: a persistent left rail replaces the mobile bottom bar.
  const sideNav = (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-gray-200 bg-white px-3 py-4 lg:flex">
      <Link
        href="/patient/home"
        aria-label={t("care")}
        className="mb-6 px-3 py-1"
      >
        <img
          src={careConfig.mainLogo?.dark}
          alt={t("care")}
          className="h-8 w-auto"
        />
      </Link>
      <nav
        aria-label={t("patient_shell__navigation")}
        className="flex flex-col gap-1"
      >
        {TABS.map((tab) => {
          const isActive = path?.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-primary-50 font-bold text-primary-700"
                  : "font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="size-5" strokeWidth={1.9} />
              {t(tab.label)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );

  // Mobile is a centred card; desktop drops the card chrome for a left rail
  // plus a flush content column.
  return (
    <div className="flex min-h-dvh bg-gray-100 lg:bg-white">
      {sideNav}
      <div className="flex min-w-0 flex-1 justify-center">
        <div className="flex w-full min-w-0 flex-col bg-gray-50">
          <header className="sticky top-0 z-10 shrink-0 border-b border-gray-200 bg-white">
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
              {/* Two header variants. Home leads with the logo — it is the
                  portal's only branded surface, and the tab bar already tells
                  you where you are; every other screen leads with its title. The
                  desktop rail already carries the logo, so hide it there. */}
              {title ? (
                <h1 className="min-w-0 truncate text-xl font-bold tracking-tight text-gray-900">
                  {title}
                </h1>
              ) : (
                <Link
                  href="/patient/home"
                  aria-label={t("care")}
                  className="flex min-h-11 items-center lg:hidden"
                >
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

          {/* Switching patient moves the whole app's data scope, so the
              confirmation is announced. The region stays mounted — screen
              readers can miss one inserted together with its content. */}
          <div role="status" aria-live="polite">
            {switchedTo && (
              <div className="mx-4 mt-3 flex items-center gap-2.5 rounded-xl border border-primary-200 bg-primary-50 px-3.5 py-2.5">
                <Check className="size-4 text-primary-700" strokeWidth={2.4} />
                <span className="text-xs font-semibold text-primary-800">
                  {t("patient_shell__now_showing", { name: switchedTo })}
                </span>
              </div>
            )}
          </div>

          <main className="flex min-w-0 flex-1 flex-col sm:px-4">
            {children}
          </main>

          {!hideTabs && (
            <nav
              aria-label={t("patient_shell__navigation")}
              className="sticky bottom-0 grid shrink-0 grid-cols-4 border-t border-gray-200 bg-white px-2.5 pb-6 pt-2.5 sm:rounded-b-3xl sm:pb-2 lg:hidden"
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
