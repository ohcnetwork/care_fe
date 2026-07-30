import careConfig from "@careConfig";
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
  /** Pinned above the fold of the column, e.g. the selection summary + CTA. */
  footer?: React.ReactNode;
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
  footer,
}: BookingStepLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-dvh justify-center bg-gray-50">
      <div className="flex w-full max-w-[480px] flex-col bg-gray-50">
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
          <div className="flex min-w-0 items-center gap-2.5 px-4 pt-3">
            <button
              type="button"
              onClick={onBack}
              aria-label={t("back")}
              className="-ml-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="size-5" strokeWidth={1.9} />
            </button>
            <img
              src={careConfig.mainLogo?.dark}
              alt={t("care")}
              className="h-6 w-auto shrink-0"
            />
            <span className="ml-auto shrink-0 text-xs font-semibold text-gray-600">
              {t("patient_booking__step_of", { step, total: totalSteps })}
            </span>
          </div>
          <div className="flex min-w-0 flex-col px-4 pb-2.5 pt-2 leading-tight">
            <span className="truncate font-bold text-gray-900">{title}</span>
            {subtitle && (
              <span className="truncate text-xs text-gray-600">{subtitle}</span>
            )}
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
                  index < step ? "bg-primary-700" : "bg-gray-200",
                )}
              />
            ))}
          </div>
        </header>

        <div className="flex flex-1 flex-col">{children}</div>

        {footer && (
          <div className="sticky bottom-0 border-t border-gray-200 bg-white p-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
