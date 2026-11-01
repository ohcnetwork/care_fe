import { ArrowLeft } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

interface PatientAppShellProps {
  children: React.ReactNode;
  title?: string;
  /** Renders a back affordance instead of the tab bar's implicit navigation. */
  backTo?: string;
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
  headerAction,
  headerTabs,
}: PatientAppShellProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {(title || backTo || headerAction) && (
        <div className="flex min-w-0 items-center gap-2.5 px-4 py-3">
          {backTo && (
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => navigate(backTo)}
              aria-label={t("back")}
            >
              <ArrowLeft className="size-5" strokeWidth={1.9} />
            </Button>
          )}
          {title && (
            <h1 className="min-w-0 truncate text-xl font-bold tracking-tight text-gray-900">
              {title}
            </h1>
          )}
          {headerAction && (
            <div className="ml-auto flex items-center gap-2">
              {headerAction}
            </div>
          )}
        </div>
      )}
      {headerTabs && (
        <div className="border-b border-gray-200">{headerTabs}</div>
      )}
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
