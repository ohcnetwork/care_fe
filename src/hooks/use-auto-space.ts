/**
 * @name use-auto-space
 * @description Returns an onBeforeInput handler that auto-inserts a space after punctuation when the next character typed is not a space.
 * @type registry:hook
 */
import * as React from "react";

const PUNCT = new Set([".", ",", "!", "?", ";", ":"]);

/**
 * Returns an `onBeforeInput` handler that auto-inserts a space after
 * punctuation (. , ! ? ; :) when the next character typed is not already
 * a space.
 *
 * Why `onBeforeInput`:
 * - Fires *before* the DOM is mutated → no need to fix the value afterward
 * - O(1): only inspects `value[cursor - 1]`, never scans the full string
 * - No cursor jump: `document.execCommand` handles insertion + cursor natively
 * - No re-renders, no native-setter hacks, no `useLayoutEffect` needed
 *
 * Special cases that are left untouched:
 * - Decimal / version numbers: "3.14", "1.0.2" — digit · dot · digit
 * - Thousands separators: "1,000" — digit · comma · digit
 * - The typed character is whitespace or punctuation itself
 * - IME composition events (mobile keyboards)
 *
 * Known design limitation (cannot be resolved at character level):
 * - letter·dot·letter is ambiguous: "Dr.Smith" (wanted: space) vs "U.S.A"
 *   (unwanted: space). Restrict autoSpace to prose-only fields (notes, comments)
 *   and never enable on structured clinical or code fields.
 */
export function useAutoSpace(
  enabled: boolean,
): React.InputEventHandler<HTMLInputElement | HTMLTextAreaElement> {
  return React.useCallback(
    (e: React.InputEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!enabled) return;

      const event = e.nativeEvent as InputEvent;

      // Skip IME composition events (mobile CJK / predictive keyboards).
      // During composition, event.data may be a partial syllable; intercepting
      // it would corrupt the composition buffer.
      if (event.isComposing) return;

      const char = event.data;

      // Only handle single printable character insertions.
      if (!char || char.length !== 1) return;

      // Skip if the character being typed is itself whitespace or punctuation.
      if (/\s/.test(char) || PUNCT.has(char)) return;

      const el = e.currentTarget;
      const cursor = el.selectionStart ?? 0;
      if (cursor === 0) return;

      const prevChar = el.value[cursor - 1];
      if (!PUNCT.has(prevChar)) return;

      // Exception: decimal / version / dosage numbers — skip whenever a digit
      // follows ".". Covers: "3.14", "1.0.2", "TDS.5", "192.168.0.1", etc.
      // Using a one-sided guard (just char-is-digit) is intentionally conservative:
      // it avoids corrupting any numeric or medical abbreviation context.
      if (prevChar === "." && /\d/.test(char)) return;

      // Exception: thousands separators — digit,digit → "1,000", "12,000".
      // Only skip when the character immediately before the comma is also a digit
      // so that list commas ("apples,oranges") still receive a space.
      if (prevChar === "," && /\d/.test(char)) {
        const beforeComma = cursor >= 2 ? el.value[cursor - 2] : "";
        if (/\d/.test(beforeComma)) return;
      }

      // Intercept the keystroke and re-insert as " <char>".
      // execCommand preserves undo history and positions the cursor correctly.
      event.preventDefault();
      // execCommand retains the native undo history for this opt-in enhancement.
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.execCommand("insertText", false, " " + char);
    },
    [enabled],
  );
}
