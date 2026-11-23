import { Circle, CircleCheck, CircleX } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

export type Gender = "male" | "female" | "non_binary" | "transgender";

type Validation = {
  description: string;
  fulfilled: boolean;
};

type ValidationHelperProps = {
  validations: Validation[];
  successMessage: string;
  isInputEmpty: boolean;
};

const hintIconClassName = "mt-0.5 size-4 shrink-0";

export const ValidationHelper = ({
  validations,
  successMessage,
  isInputEmpty,
}: ValidationHelperProps) => {
  const { t } = useTranslation();
  const allValid =
    !isInputEmpty && validations.every((validation) => validation.fulfilled);

  if (allValid) {
    return (
      <p className="flex items-start gap-1.5 text-sm text-primary">
        <CircleCheck aria-hidden="true" className={hintIconClassName} />
        {successMessage}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1 text-sm text-pretty text-soft-foreground">
      {validations.map((validation) => {
        const met = !isInputEmpty && validation.fulfilled;
        const Icon = met ? CircleCheck : Circle;
        return (
          <li
            key={validation.description}
            className={cn(
              "flex items-start gap-1.5 [&_strong]:font-medium",
              met && "text-primary",
            )}
          >
            <Icon aria-hidden="true" className={hintIconClassName} />
            <span>
              <span className="sr-only">
                {t(met ? "completed" : "incomplete")}:{" "}
              </span>
              <Trans i18nKey={validation.description} />
            </span>
          </li>
        );
      })}
    </ul>
  );
};

export const validateRule = (
  isConditionMet: boolean,
  initialMessage: React.ReactNode,
  isInitialRender: boolean = false,
  successMessage: React.ReactNode,
) => {
  const Icon = isInitialRender
    ? Circle
    : isConditionMet
      ? CircleCheck
      : CircleX;
  return (
    <p
      className={cn(
        "flex items-start gap-1.5 text-sm",
        isInitialRender
          ? "text-soft-foreground"
          : isConditionMet
            ? "text-primary"
            : "text-destructive",
      )}
    >
      <Icon aria-hidden="true" className={hintIconClassName} />
      {isInitialRender || !isConditionMet ? initialMessage : successMessage}
    </p>
  );
};
