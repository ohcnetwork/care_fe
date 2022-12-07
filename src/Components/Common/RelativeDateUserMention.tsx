import CareIcon from "../../CAREUI/icons/CareIcon";
import { formatDate, relativeDate } from "../../Utils/utils";
import { UserModel } from "../Users/models";

function RelativeDateUserMention(props: {
  actionDate?: string;
  user?: UserModel;
  tooltipPosition?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <div className="flex flex-row items-center">
      <div className="tooltip">
        <span
          className={`tooltip-text tooltip-${props.tooltipPosition || "top"}`}
        >
          {props.actionDate ? formatDate(props.actionDate) : "--:--"}
        </span>
        {props.actionDate ? relativeDate(props.actionDate) : "--:--"}
      </div>
      {props.user && (
        <div className="tooltip">
          <span
            className={`tooltip-text tooltip-${props.tooltipPosition || "top"}`}
          >
            <div className="text-sm leading-5 text-white whitespace-normal font-semibold flex flex-col md:w-max">
              <p className="flex justify-center">{`${props.user.first_name} ${props.user.last_name}`}</p>
              <p className="flex justify-center">{`@${props.user.username}`}</p>
              <p className="flex justify-center">{props.user.user_type}</p>
            </div>
          </span>
          <CareIcon className="ml-1 care-l-user-circle text-green-700 font-semibold text-xl hover:text-green-600" />
        </div>
      )}
    </div>
  );
}

export default RelativeDateUserMention;
