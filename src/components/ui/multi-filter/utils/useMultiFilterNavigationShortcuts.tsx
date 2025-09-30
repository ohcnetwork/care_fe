import { useState } from "react";
import useKeyboardShortcut from "use-keyboard-shortcut";

export default function useMultiFilterNavigationShortcuts(
  optionsLength: number,
  handleBack?: () => void,
) {
  const [focusItemIndex, setFocusItemIndex] = useState<number | null>(null);

  useKeyboardShortcut(
    ["ArrowUp"],
    () => {
      if (focusItemIndex === null) {
        setFocusItemIndex(optionsLength - 1);
      } else {
        const newIndex = (focusItemIndex - 1 + optionsLength) % optionsLength;
        setFocusItemIndex(newIndex);
      }
    },
    {
      overrideSystem: true,
    },
  );

  useKeyboardShortcut(
    ["ArrowDown"],
    () => {
      if (focusItemIndex === null) {
        setFocusItemIndex(0);
      } else {
        const newIndex = (focusItemIndex + 1) % optionsLength;
        setFocusItemIndex(newIndex);
      }
    },
    {
      overrideSystem: true,
    },
  );

  useKeyboardShortcut(
    ["ArrowLeft"],
    () => {
      handleBack?.();
    },
    {
      overrideSystem: true,
    },
  );

  return { focusItemIndex, setFocusItemIndex };
}
