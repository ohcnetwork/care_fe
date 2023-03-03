import { MouseEventHandler, useEffect, useState } from "react";

type iconType = "uil" | "fa";
interface Props {
  size?: "small" | "medium" | "large";
  hideBorder?: boolean;
  color?: string;
  startIcon?: string | JSX.Element;
  startIconType?: iconType;
  endIcon?: string | JSX.Element;
  endIconType?: iconType;
  text: string;
  onStartIconClick?: MouseEventHandler<HTMLElement>;
  onEndIconClick?: MouseEventHandler<HTMLElement>;
}

export default function Chip(props: Props) {
  const [chipStyle, setChipStyle] = useState("");

  useEffect(() => {
    switch (props.size) {
      case "small":
        setChipStyle("px-2 py-1 rounded text-xs");
        break;

      case "large":
        setChipStyle("px-4 py-3 rounded-lg text-sm");
        break;

      default:
        setChipStyle("px-3 py-2 rounded-lg text-xs");
        break;
    }
  }, [props.size]);

  return (
    <span
      className={`inline-flex ${
        props.hideBorder === true || `border border-${props.color}-300`
      } items-center gap-2 ${chipStyle} font-medium leading-4 bg-${
        props.color
      }-100 text-gray-800 text-${props.color}-900`}
      title={props.text}
    >
      {props.startIcon && (
        <button
          className={`text-${props.color}-500`}
          onClick={props.onStartIconClick}
        >
          {typeof props.startIcon === "string" ? (
            <i
              className={
                (props.startIconType && props.startIconType === "uil"
                  ? "uil uil-"
                  : "fas fa-") + props.startIcon
              }
            />
          ) : (
            props.startIcon
          )}
        </button>
      )}
      {props.text}
      {props.endIcon && (
        <button
          className={`text-${props.color}-500`}
          onClick={props.onEndIconClick}
        >
          {typeof props.endIcon === "string" ? (
            <i
              className={
                (props.endIconType && props.endIconType === "uil"
                  ? "uil uil-"
                  : "fas fa-") + props.endIcon
              }
            />
          ) : (
            props.endIcon
          )}
        </button>
      )}
    </span>
  );
}
