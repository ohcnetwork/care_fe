import clsx from "clsx";
import React from "react";
import { BadgeGroupProps as Props } from "./types";

const BadgeGroup = ({
  badges,
  className,
  badgeClassName,
  badgeSelectedClassName,
  badgeLeadingIconClassName,
  badgeTrailingIconClassName,
  badgeOnClick,
  badgeLeadingIconOnClick,
  badgeTrailingIconOnClick,
  badgeDisabledClassName,
}: Props) => {
  return (
    <ul
      className={clsx(
        "flex flex-wrap p-4 w-full justify-center items-center rounded-sm gap-2",
        className
      )}
    >
      {badges.map(
        (
          {
            label,
            key,
            selected,
            onClick,
            className,
            disabled,
            leadingIcon,
            leadingIconClassName,
            leadingIconOnClick,
            trailingIcon,
            trailingIconClassName,
            trailingIconOnClick,
          },
          i
        ) => (
          <li
            key={key ?? label + i}
            className={clsx(
              "p-2 text-xs text-white bg-gray-600 rounded hover:bg-gray-300 cursor-pointer",
              selected &&
                (badgeSelectedClassName ?? "!bg-green-600 hover:!bg-green-300"),
              disabled &&
                (badgeDisabledClassName ??
                  "cursor-not-allowed !bg-gray-300 hover:!bg-gray-300"),
              className ?? badgeClassName
            )}
            onClick={!disabled ? onClick ?? badgeOnClick : undefined}
          >
            {leadingIcon && (
              <span
                className={clsx(
                  "mr-2 p-2 cursor-pointer",
                  leadingIconClassName ?? badgeLeadingIconClassName
                )}
                onClick={leadingIconOnClick ?? badgeLeadingIconOnClick}
              >
                {leadingIcon}
              </span>
            )}
            {label}
            {trailingIcon && (
              <span
                className={clsx(
                  "ml-2 p-2 cursor-pointer",
                  trailingIconClassName ?? badgeTrailingIconClassName
                )}
                onClick={trailingIconOnClick ?? badgeTrailingIconOnClick}
              >
                {trailingIcon}
              </span>
            )}
          </li>
        )
      )}
    </ul>
  );
};

export default BadgeGroup;
