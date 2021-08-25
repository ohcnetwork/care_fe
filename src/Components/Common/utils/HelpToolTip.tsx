import React from "react";
import Tooltip from "@material-ui/core/Tooltip";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";

export default function HelpToolTip(props: any) {
  const { text, link, place = "right" } = props;
  return (
    <Tooltip
      title={
        <div>
          <span className="text-base">{text}</span>
          <a href={link} target="_blank" className="text-blue-200 text-base">
            here
          </a>
        </div>
      }
      interactive
      arrow
      placement={place}
    >
      <HelpOutlineIcon></HelpOutlineIcon>
    </Tooltip>
  );
}
