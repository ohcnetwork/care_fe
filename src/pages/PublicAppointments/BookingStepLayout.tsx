import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

interface BookingStepLayoutProps {
  title: string;
  subtitle?: string;
  /** 1-based index of the current step. */
  step: number;
  totalSteps: number;
  onBack: () => void;
  children: React.ReactNode;
  /**
   * Rendered inside the header, under the progress bar, so it shares the
   * header's single bottom rule instead of drawing a second one.
   */
  headerExtra?: React.ReactNode;
  /** Pinned above the fold of the column, e.g. the selection summary + CTA. */
  footer?: React.ReactNode;
  /** Rules the footer off from content that scrolls behind it. */
  footerBordered?: boolean;
}

/**
 * Shared chrome for the appointment booking steps: back affordance, step
 * counter and a progress bar, inside the same 480px column the rest of the
 * patient app uses.
 */
export default function BookingStepLayout({
  title,
  subtitle,
  step,
  totalSteps,
  onBack,
  children,
  headerExtra,
  footer,
  footerBordered,
}: BookingStepLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-dvh justify-center bg-gray-100">
      <div className="flex w-full min-w-0 flex-col bg-gray-50 sm:min-h-0">
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
          <div className="flex min-w-0 items-center gap-2.5 px-4 pb-2.5 pt-3">
            <button
              type="button"
              onClick={onBack}
              aria-label={t("back")}
              className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-lg text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="size-5" strokeWidth={1.9} />
            </button>
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate font-bold text-gray-900">{title}</span>
              {subtitle && (
                <span className="truncate text-xs text-gray-600">
                  {subtitle}
                </span>
              )}
            </div>
            <span className="ml-auto shrink-0 text-xs font-semibold text-gray-600">
              {t("patient_booking__step_of", { step, total: totalSteps })}
            </span>
          </div>
          <div
            className="flex gap-1 px-4 pb-3"
            role="progressbar"
            aria-valuenow={step}
            aria-valuemin={1}
            aria-valuemax={totalSteps}
          >
            {Array.from({ length: totalSteps }).map((_, index) => (
              <span
                key={index}
                className={cn(
                  "h-1 flex-1 rounded-full",
                  index < step ? "bg-primary-700" : "bg-gray-100",
                )}
              />
            ))}
          </div>
          {headerExtra}
        </header>

        <div className="flex flex-1 flex-col">{children}</div>

        {footer && (
          <div
            className={cn(
              "sticky bottom-0 bg-gray-50 px-4 pb-4",
              footerBordered ? "border-t border-gray-200 pt-3.5" : "pt-2",
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
