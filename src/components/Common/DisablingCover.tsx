import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import "./DisablingCover.css";

interface DisablingCoverProps {
  disabled: boolean;
  message?: string;
  containerClassName?: string;
  children: React.ReactNode;
}

export function DisablingCover({
  disabled,
  message,
  containerClassName = "",
  children,
}: DisablingCoverProps) {
  const { t } = useTranslation();
  const displayMessage = message ?? t("loading");

  return (
    <div className={cn("relative", containerClassName)}>
      {disabled && (
        <>
          <div className="absolute w-full h-full bg-white opacity-75 z-20 flex items-center justify-center" />
          <div className="absolute w-full h-full z-20 flex items-center justify-center">
            <div className="disabling-cover__loading-container bg-white rounded-lg shadow-xl p-4">
              <div className="disabling-cover__loading-animation-box mx-auto">
                <div className="disabling-cover__loading-box-1" />
                <div className="disabling-cover__loading-box-2" />
                <div className="disabling-cover__loading-box-3" />
              </div>
              <span className="block pt-2 font-semibold max-w-sm text-center text-sm">
                {displayMessage}
              </span>
            </div>
          </div>
        </>
      )}
      {children}
    </div>
  );
}
