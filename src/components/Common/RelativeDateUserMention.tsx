import CareIcon from "@/CAREUI/icons/CareIcon";

import { UserBareMinimum } from "@/components/Users/models";

import { formatDateTime, formatName, relativeDate } from "@/Utils/utils";

function RelativeDateUserMention(props: {
  actionDate?: string;
  user?: UserBareMinimum;
  tooltipPosition?: "top" | "bottom" | "left" | "right";
  withoutSuffix?: boolean;
}) {
  return (
    <div className="flex flex-row flex-wrap items-center justify-start">
      <div className="tooltip">
        <span
          className={`tooltip-text tooltip-${props.tooltipPosition || "top"}`}
        >
          {props.actionDate ? formatDateTime(props.actionDate) : "--:--"}
        </span>
        {props.actionDate
          ? relativeDate(props.actionDate, props.withoutSuffix ?? false)
          : "--:--"}
      </div>
      {props.user && (
        <div className="tooltip">
          <span
            className={`tooltip-text tooltip-${
              props.tooltipPosition || "left"
            }`}
          >
            <div className="flex flex-col whitespace-normal text-sm font-semibold leading-5 text-white">
              <p className="flex justify-center">{formatName(props.user)}</p>
              <p className="flex justify-center">{`@${props.user.username}`}</p>
              <p className="flex justify-center">{props.user.user_type}</p>
            </div>
          </span>
          <CareIcon
            icon="l-user-circle"
            className="ml-1 text-xl font-semibold text-green-700 hover:text-green-600"
          />
        </div>
      )}
    </div>
  );
}

export default RelativeDateUserMention;
