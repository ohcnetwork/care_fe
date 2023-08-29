import { CameraPTZ } from "../../../Common/constants";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { classNames } from "../../../Utils/utils";

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
    <button
      className={classNames("tooltip", buttonClass)}
      onClick={props.clickAction}
    >
      {props.camProp.icon ? (
        <CareIcon className={`care-${props.camProp.icon}`} />
      ) : (
        <span className="font-bold">{props.camProp.value}x</span>
      )}

      <span
        className={classNames(
          "tooltip-text top-2.5 text-sm font-semibold",
          props.camProp.label.includes("Move")
            ? "tooltip-right"
            : "tooltip-left"
        )}
      >
        {`${props.camProp.label}  (${shortcutKeyDescription(props.camProp)})`}
      </span>
    </button>
  );
}
