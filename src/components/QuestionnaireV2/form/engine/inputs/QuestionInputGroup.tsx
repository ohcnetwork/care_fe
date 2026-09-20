import { type ReactNode, useId } from "react";
import { useTranslation } from "react-i18next";

interface QuestionInputGroupProps {
  labelId: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/** ARIA groups do not support aria-required. Describe the requirement for
 * composite inputs whose question label lives outside their controls. */
export function QuestionInputGroup({
  labelId,
  required,
  className,
  children,
}: QuestionInputGroupProps) {
  const { t } = useTranslation();
  const requirementId = useId();
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-describedby={required ? requirementId : undefined}
      className={className}
    >
      {required && (
        <span id={requirementId} className="sr-only">
          {t("required")}
        </span>
      )}
      {children}
    </div>
  );
}
