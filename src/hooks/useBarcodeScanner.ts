import { useEffect, useRef } from "react";

interface BarcodeScannerOptions {
  onScan: (barcode: string) => void;
  minLength?: number;
  maxLength?: number;
  timeout?: number;
  enabled?: boolean;
  preventDefault?: boolean;
}

/**
 * Hook to detect external barcode/QR scanner input (keyboard wedge devices)
 *
 * External scanners typically:
 * - Type very fast (characters arrive within milliseconds)
 * - Often send an Enter key at the end
 * - Don't have typical keyboard delays between keystrokes
 *
 * @param options Configuration options
 * @param options.onScan Callback when a barcode is detected
 * @param options.minLength Minimum barcode length (default: 5)
 * @param options.maxLength Maximum barcode length (default: 100)
 * @param options.timeout Time window to collect characters in ms (default: 40)
 * @param options.enabled Whether scanning is enabled (default: true)
 * @param options.preventDefault Whether to prevent default behavior (default: true)
 */
export function useBarcodeScanner({
  onScan,
  minLength = 5,
  maxLength = 100,
  timeout = 40,
  enabled = true,
  preventDefault = true,
}: BarcodeScannerOptions) {
  const bufferRef = useRef<string>("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if typing in input fields (unless you want to capture there too)
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true";

      // Skip if typing in input fields or if modifier keys are pressed
      if (isInputField || event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      const currentTime = Date.now();
      const timeSinceLastKey = currentTime - lastKeyTimeRef.current;

      // If Enter is pressed, finalize the scan
      if (event.key === "Enter") {
        if (preventDefault) event.preventDefault();

        const scannedValue = bufferRef.current.trim();
        if (
          scannedValue.length >= minLength &&
          scannedValue.length <= maxLength
        ) {
          onScan(scannedValue);
        }
        bufferRef.current = "";
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        return;
      }

      // Detect rapid typing (scanner behavior)
      // If time between keys is very short (< timeout), it's likely a scanner
      if (timeSinceLastKey > timeout && bufferRef.current.length > 0) {
        // Reset buffer if too much time passed (human typing)
        bufferRef.current = "";
      }

      // Only capture single character keys
      if (event.key.length === 1) {
        // Prevent the character from appearing in input fields if needed
        if (preventDefault && !isInputField) {
          event.preventDefault();
        }

        bufferRef.current += event.key;
        lastKeyTimeRef.current = currentTime;

        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Set timeout to finalize if no more keys arrive
        timeoutRef.current = setTimeout(() => {
          const scannedValue = bufferRef.current.trim();
          if (
            scannedValue.length >= minLength &&
            scannedValue.length <= maxLength
          ) {
            onScan(scannedValue);
          }
          bufferRef.current = "";
        }, timeout);
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, onScan, minLength, maxLength, timeout, preventDefault]);
}
