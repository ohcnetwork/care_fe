import { Trans } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

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
export const ValidationHelper = ({
  validations,
  successMessage,
  isInputEmpty,
}: ValidationHelperProps) => {
  const unfulfilledValidations = validations.filter(
    (validation) => !validation.fulfilled,
  );

  const allValid = unfulfilledValidations.length === 0 && !isInputEmpty;

  return (
    <div>
      {isInputEmpty &&
        validations.map((validation, index) => (
          <div key={index} className="text-gray-500 mb-2 text-sm">
            <Trans i18nKey={validation.description} />
          </div>
        ))}
      {!isInputEmpty &&
        !allValid &&
        unfulfilledValidations.map((validation, index) => (
          <div key={index} className="text-gray-500 mb-2 text-sm">
            <Trans i18nKey={validation.description} />
          </div>
        ))}
      {allValid && (
        <>
          <CareIcon icon="l-check-circle" className="text-sm text-green-500" />
          <span className="text-green-600 mt-3 ml-1 text-sm">
            {successMessage}
          </span>
        </>
      )}
    </div>
  );
};

export const validateRule = (
  isConditionMet: boolean,
  initialMessage: React.ReactNode,
  isInitialRender: boolean = false,
  successMessage: React.ReactNode,
) => {
  return (
    <div>
      {isInitialRender ? (
        <CareIcon icon="l-circle" className="text-sm text-gray-500" />
      ) : isConditionMet ? (
        <CareIcon icon="l-check-circle" className="text-sm text-green-500" />
      ) : (
        <CareIcon icon="l-times-circle" className="text-sm text-red-500" />
      )}{" "}
      <span
        className={cn(
          isInitialRender
            ? "text-black text-sm"
            : isConditionMet
              ? "text-primary-500 text-sm"
              : "text-red-500 text-sm",
        )}
      >
        {isInitialRender
          ? initialMessage
          : isConditionMet
            ? successMessage
            : initialMessage}
      </span>
    </div>
  );
};
