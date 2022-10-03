import { MouseEventHandler } from "react";

interface Props {
  color?: string;
  startIcon?: string;
  endIcon?: string;
  text: string;
  onStartIconClick?: MouseEventHandler<HTMLElement>;
  onEndIconClick?: MouseEventHandler<HTMLElement>;
}

export function Badge(props: Props) {
  return (
    <span
      className={`inline-flex border border-${props.color}-300 items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium leading-4 bg-${props.color}-100 text-gray-800 text-${props.color}-900`}
      title={props.text}
    >
      {props.startIcon && (
        <i
          className={
            "text-md text-" + props.color + "-500 fas fa-" + props.startIcon
          }
          onClick={props.onEndIconClick}
        />
      )}
      {props.text}
      {props.endIcon && (
        <i
          className={
            "text-md text-" + props.color + "-500 fas fa-" + props.endIcon
          }
          onClick={props.onEndIconClick}
        />
      )}
    </span>
  );
}
