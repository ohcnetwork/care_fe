import useKeyboardShortcut from "use-keyboard-shortcut";
import { classNames, isAppleDevice } from "../../Utils/utils";

interface Props {
  children: React.ReactNode;
  shortcut: string[];
  onTrigger: () => void;
  shortcutSeperator?: string;
  helpText?: string;
  tooltipClassName?: string;
}

export default function KeyboardShortcut(props: Props) {
  useKeyboardShortcut(props.shortcut, props.onTrigger, {
    overrideSystem: true,
  });

  return (
    <div className="tooltip">
      {props.children}
      <span
        className={classNames(
          "tooltip-text flex items-center gap-0.5 text-xs",
          props.tooltipClassName || "tooltip-bottom",
        )}
      >
        <span className="px-1 font-bold">{props.helpText}</span>
        <kbd className="hidden items-center px-1.5 font-sans font-medium text-zinc-300 shadow md:inline-flex">
          {getShortcutKeyDescription(props.shortcut).join(" + ")}
        </kbd>
      </span>
    </div>
  );
}

const SHORTCUT_KEY_MAP = {
  Meta: "⌘",
  Shift: "⇧Shift",
  Alt: "⌥Alt",
  Control: isAppleDevice ? "⌃Ctrl" : "Ctrl",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
} as Record<string, string>;

export const getShortcutKeyDescription = (shortcut: string[]) => {
  return shortcut.map((key) => SHORTCUT_KEY_MAP[key] || key);
};
