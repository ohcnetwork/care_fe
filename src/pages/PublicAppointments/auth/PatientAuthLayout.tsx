import careConfig from "@careConfig";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

interface PatientAuthLayoutProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export default function PatientAuthLayout({
  children,
  footer,
  className,
}: PatientAuthLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="flex h-dvh justify-center bg-white sm:items-center sm:bg-gray-100">
      <div className="relative flex h-full w-full sm:max-w-md flex-col overflow-auto scrollbar-none bg-white sm:h-[min(844px,90dvh)] sm:rounded-3xl sm:border sm:border-gray-200 sm:shadow-sm">
        <img
          src="/images/care_patient_login.svg"
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 w-full select-none"
        />

        <div className="relative flex flex-1 flex-col">
          <div className={cn("flex flex-1 flex-col px-7 py-10", className)}>
            <div className="mb-12 flex items-center gap-2 self-start">
              <img
                src={careConfig.mainLogo?.dark}
                alt={t("care")}
                className="h-11 w-auto"
                onClick={() => navigate("/")}
              />
            </div>
            {children}
          </div>
        </div>
        {footer && (
          <div className="relative shrink-0 bg-white px-7 pb-7">{footer}</div>
        )}
      </div>
    </div>
  );
}
