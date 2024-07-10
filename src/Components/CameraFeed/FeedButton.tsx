import KeyboardShortcut from "../../CAREUI/interactive/KeyboardShortcut";
import { classNames } from "../../Utils/utils";

interface Props {
  className?: string;
  children?: React.ReactNode;
  readonly shortcut?: string[];
  onTrigger: () => void;
  helpText?: string;
  shortcutsDisabled?: boolean;
  tooltipClassName?: string;
}

export default function FeedButton(props: Props) {
  const child = (
    <button
      className={classNames(
        "flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700/50 bg-zinc-800/40 shadow-none transition hover:bg-zinc-50 hover:text-zinc-800 hover:shadow hover:backdrop-blur-xl active:shadow-2xl md:backdrop-blur-md",
        props.className,
      )}
      type="button"
      onClick={props.onTrigger}
    >
      {props.children}
    </button>
  );

  if (props.shortcutsDisabled || !props.shortcut) {
    return child;
  }

  return (
    <KeyboardShortcut
      shortcut={props.shortcut}
      onTrigger={props.onTrigger}
      helpText={props.helpText}
      tooltipClassName={classNames(
        props.tooltipClassName,
        "hidden lg:inline-flex",
      )}
    >
      {child}
    </KeyboardShortcut>
  );
}
