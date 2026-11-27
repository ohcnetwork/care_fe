import { useRef, type KeyboardEvent } from "react";

/**
 * Handheld scanners send keys a few ms apart, but a busy page can delay them.
 * People don't type a whole patient id this fast; the global wedge hook
 * allows 500 ms.
 */
const SCAN_KEY_GAP_MS = 100;

/**
 * Tells a handheld scanner's Enter from a typed one in a focused input. The
 * global `useBarcodeScanner` ignores inputs, so the search checks itself:
 * the whole value arrived in one rapid burst, and Enter followed at once.
 */
export function useScannerBurst() {
  const burst = useRef({ length: 0, last: 0 });

  const track = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key.length !== 1 || event.ctrlKey || event.metaKey) return;
    // When the key was pressed, not when a busy page got to it.
    const now = event.timeStamp;
    const rapid = now - burst.current.last <= SCAN_KEY_GAP_MS;
    burst.current = { length: rapid ? burst.current.length + 1 : 1, last: now };
  };

  const isScannerEnter = (
    value: string,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    const { length, last } = burst.current;
    return (
      value.length > 0 &&
      length >= value.length &&
      event.timeStamp - last <= SCAN_KEY_GAP_MS * 2
    );
  };

  const reset = () => {
    burst.current = { length: 0, last: 0 };
  };

  return { track, isScannerEnter, reset };
}
