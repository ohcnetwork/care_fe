import React from "react";
import Tooltip from "@mui/material/Tooltip";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

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
      arrow
      placement={place}
    >
      <HelpOutlineIcon></HelpOutlineIcon>
    </Tooltip>
  );
}
