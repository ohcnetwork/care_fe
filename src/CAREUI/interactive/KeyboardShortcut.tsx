import { Fragment } from "react/jsx-runtime";
import useKeyboardShortcut from "use-keyboard-shortcut";

import { classNames, isAppleDevice } from "../../Utils/utils";

interface Props {
  children?: React.ReactNode;
  shortcut: string[];
  altShortcuts?: string[][];
  onTrigger: () => void;
  helpText?: string;
  tooltipClassName?: string;
}

export default function KeyboardShortcut(props: Props) {
  useKeyboardShortcut(props.shortcut, props.onTrigger);

  if (!props.children) {
    return null;
  }

  return (
    <div className="tooltip">
      {props.children}
      <span
        className={classNames(
          "tooltip-text space-x-1 text-xs",
          props.tooltipClassName || "tooltip-bottom",
        )}
      >
        {props.helpText && (
          <span className="pl-1 font-bold">{props.helpText}</span>
        )}
        {(props.altShortcuts || [props.shortcut]).map((shortcut, idx, arr) => (
          <>
            <kbd
              key={`shortcut-${idx}`}
              className="hidden items-center px-1.5 font-sans font-medium text-zinc-300 shadow lg:inline-flex"
            >
              {shortcut.map((key, idx, keys) => (
                <>
                  {SHORTCUT_KEY_MAP[key] || key}
                  {idx !== keys.length - 1 && (
                    <span className="px-1 text-zinc-300/60"> + </span>
                  )}
                </>
              ))}
            </kbd>
            {idx !== arr.length - 1 && (
              <span
                key={`shortcut-separator-${idx}`}
                className="text-zinc-300/60"
              >
                or
              </span>
            )}
          </>
        ))}
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

export function KeyboardShortcutKey(props: {
  shortcut: string[];
  useShortKeys?: boolean;
}) {
  const { shortcut, useShortKeys } = props;

  return (
    <div className="hidden shrink-0 items-center md:flex">
      {shortcut.map((key, idx, keys) => (
        <Fragment key={idx}>
          <kbd className="relative z-10 flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md border border-b-4 border-secondary-400 bg-secondary-100 px-2 text-xs text-black">
            {SHORTCUT_KEY_MAP[key]
              ? useShortKeys
                ? SHORTCUT_KEY_MAP[key][0]
                : SHORTCUT_KEY_MAP[key]
              : key}
          </kbd>
          {idx !== keys.length - 1 && (
            <span className="px-1 text-zinc-300/60"> + </span>
          )}
        </Fragment>
      ))}
    </div>
  );
}
