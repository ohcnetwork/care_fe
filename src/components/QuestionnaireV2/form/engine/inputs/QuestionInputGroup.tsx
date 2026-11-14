import { type ReactNode, useId } from "react";
import { useTranslation } from "react-i18next";

interface QuestionInputGroupProps {
  labelId: string;
  required?: boolean;
  errorId?: string;
  className?: string;
  children: ReactNode;
}

/** ARIA groups do not support aria-required. Describe the requirement for
 * composite inputs whose question label lives outside their controls. */
export function QuestionInputGroup({
  labelId,
  required,
  errorId,
  className,
  children,
}: QuestionInputGroupProps) {
  const { t } = useTranslation();
  const requirementId = useId();
  const descriptionIds = [required ? requirementId : undefined, errorId]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-describedby={descriptionIds || undefined}
      aria-invalid={!!errorId || undefined}
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
