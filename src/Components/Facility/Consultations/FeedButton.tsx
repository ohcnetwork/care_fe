import { Tooltip } from "@material-ui/core";
import { CameraPTZ } from "../../../Common/constants";

export default function FeedButton(props: {
  camProp: any;
  styleType: "PLAIN" | "BUTTON" | "CHHOTUBUTTON";
  clickAction: () => void;
}) {
  const shortcutKeyDescription = (option: CameraPTZ) =>
    option.shortcutKey &&
    option.shortcutKey
      .join(" + ")
      .replace("Control", "Ctrl")
      .replace("ArrowUp", "↑")
      .replace("ArrowDown", "↓")
      .replace("ArrowLeft", "←")
      .replace("ArrowRight", "→");

  let buttonClass =
    "bg-white/50 rounded-full flex items-center text-black hover:bg-white/60 transition justify-center";

  switch (props.styleType) {
    case "BUTTON":
      buttonClass += " w-[60px] h-[60px] text-2xl";
      break;

    case "CHHOTUBUTTON":
      buttonClass += " w-[50px] h-[50px] text-xl";
      break;

    case "PLAIN":
      buttonClass = "text-white/40";
      break;

    default:
      break;
  }

  return (
    <Tooltip
      key={props.camProp.action}
      placement="left"
      arrow={true}
      title={
        <span className="text-sm font-semibold">
          {`${props.camProp.label}  (${shortcutKeyDescription(props.camProp)})`}
        </span>
      }
    >
      <button className={buttonClass} onClick={props.clickAction}>
        {props.camProp.icon ? (
          <i className={"fas fa-" + props.camProp.icon} />
        ) : (
          <span className="font-bold">{props.camProp.value}x</span>
        )}
      </button>
    </Tooltip>
  );
}
