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
          <div className="flex items-center px-4 pt-4">
            <button
              type="button"
              onClick={onBack}
              aria-label={t("back")}
              className="flex size-10 items-center justify-center rounded-xl text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="size-5" />
            </button>
          </div>
        )}
        <div
          className={cn(
            "flex flex-1 flex-col px-7 pb-7",
            onBack ? "pt-6" : "pt-14",
            className,
          )}
        >
          {showLogo && (
            <img
              src={careConfig.mainLogo?.dark}
              alt={t("care")}
              className="mb-12 h-9 w-auto self-start"
            />
          )}
          {children}
          {footer && <div className="mt-auto pt-8">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
