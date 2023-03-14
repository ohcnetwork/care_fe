import React from "react";
import Tooltip from "@material-ui/core/Tooltip";
import CareIcon from "../../../CAREUI/icons/CareIcon";

export default function HelpToolTip(props: any) {
  const { text, link, place = "right" } = props;
  return (
    <Tooltip
      title={
        <div>
          <span className="text-base">{text}</span>
          <a
            href={link}
            rel="noreferrer noopener"
            target="_blank"
            className="text-blue-200 text-base"
          >
            here
          </a>
        </div>
      }
      interactive
      arrow
      placement={place}
    >
      <CareIcon className="care-l-question-circle text-2xl" />
    </Tooltip>
  );
}
