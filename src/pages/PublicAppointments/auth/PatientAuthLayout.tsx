import careConfig from "@careConfig";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

interface PatientAuthLayoutProps {
  children: React.ReactNode;
  /** Renders a back affordance in the top bar when provided. */
  onBack?: () => void;
  /** Shows the care logo above the heading. Only the first step needs it. */
  showLogo?: boolean;
  /** Pinned to the bottom of the column, below the scrolling content. */
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Mobile-first shell for the patient sign-in screens: a full-height column
 * that stays 480px wide and centred from `sm` upwards.
 */
export default function PatientAuthLayout({
  children,
  onBack,
  showLogo,
  footer,
  className,
}: PatientAuthLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-dvh justify-center bg-white sm:items-center sm:bg-gray-100">
      <div className="flex w-full max-w-[480px] flex-col bg-white sm:min-h-[min(844px,90dvh)] sm:rounded-3xl sm:border sm:border-gray-200 sm:shadow-sm">
        {onBack && (
          <div className="flex items-center px-5 pt-4">
            <button
              type="button"
              onClick={onBack}
              aria-label={t("back")}
              className="flex size-10 items-center justify-center rounded-xl text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="size-[22px]" strokeWidth={1.9} />
            </button>
          </div>
        )}
        <div
          className={cn(
            "flex flex-1 flex-col px-7 pb-7",
            onBack ? "pt-7" : "pt-14",
            className,
          )}
        >
          {/* The design draws its own "care." lockup, but the logo is
              deployment-configurable — so take the design's compact scale and
              leave the mark itself to whoever is running this instance. */}
          {showLogo && (
            <img
              src={careConfig.mainLogo?.dark}
              alt={t("care")}
              className="mb-14 h-[38px] w-auto self-start"
            />
          )}
          {children}
          {footer && <div className="mt-auto pt-8">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
