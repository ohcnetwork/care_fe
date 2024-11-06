import KeyboardShortcut from "@/CAREUI/interactive/KeyboardShortcut";

import { classNames } from "@/Utils/utils";

interface Props {
  className?: string;
  children?: React.ReactNode;
  shortcuts?: string[][];
  onTrigger: () => void;
  helpText?: string;
  shortcutsDisabled?: boolean;
  tooltipClassName?: string;
}

export default function FeedButton(props: Props) {
  const child = (
    <button
      className={classNames(
        "flex h-10 w-10 items-center justify-center rounded-lg border shadow-sm transition hover:backdrop-blur-xl sm:shadow-none sm:hover:shadow sm:active:shadow-2xl md:backdrop-blur-md",
        "border-zinc-500/30 text-zinc-500 sm:border-zinc-700/50 sm:bg-zinc-800/40 sm:text-zinc-200 sm:hover:bg-zinc-50 sm:hover:text-zinc-800",
        props.className,
      )}
      type="button"
      onClick={props.onTrigger}
    >
      {props.children}
    </button>
  );

  if (props.shortcutsDisabled || !props.shortcuts) {
    return child;
  }

  return (
    <>
      {props.shortcuts.map((shortcut, idx) => (
        <KeyboardShortcut
          key={idx}
          shortcut={shortcut}
          onTrigger={props.onTrigger}
          helpText={props.helpText}
          tooltipClassName={classNames(
            props.tooltipClassName,
            "hidden lg:inline-flex",
          )}
          altShortcuts={idx === 0 ? props.shortcuts : undefined}
        >
          {idx === 0 && child}
        </KeyboardShortcut>
      ))}
    </>
  );
}
