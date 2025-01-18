import CareIcon from "@/CAREUI/icons/CareIcon";

import { classNames } from "@/Utils/utils";

export type UserType = "doctor" | "nurse" | "staff" | "volunteer";

export type Gender = "male" | "female" | "non_binary" | "transgender";

export const validateRule = (
  isConditionMet: boolean,
  initialMessage: JSX.Element | string,
  isInitialRender: boolean = false,
  successMessage: JSX.Element | string,
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
        className={classNames(
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
