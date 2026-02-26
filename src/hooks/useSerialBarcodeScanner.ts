import { useCallback, useEffect, useRef, useState } from "react";

interface SerialScannerOptions {
  /** Callback when a barcode is scanned */
  onScan: (barcode: string) => void;
  /** Baud rate for serial communication (default: 9600) */
  baudRate?: number;
  /** Data bits (default: 8) */
  dataBits?: 7 | 8;
  /** Stop bits (default: 1) */
  stopBits?: 1 | 2;
  /** Parity (default: "none") */
  parity?: "none" | "even" | "odd";
  /** Whether the hook is enabled (default: true) */
  enabled?: boolean;
  /** Line ending character(s) to detect end of barcode (default: "\r" or "\n") */
  lineEnding?: "cr" | "lf" | "crlf";
  /** Auto-reconnect to previously connected port on mount (default: true) */
  autoReconnect?: boolean;
}

interface SerialScannerState {
  /** Whether Web Serial API is supported in this browser */
  isSupported: boolean;
  /** Whether currently connected to a serial port */
  isConnected: boolean;
  /** Whether currently attempting to connect */
  isConnecting: boolean;
  /** Error message if any */
  error: string | null;
  /** Information about connected port */
  portInfo: SerialPortInfo | null;
}

interface SerialScannerReturn extends SerialScannerState {
  /** Connect to a serial port (shows browser picker) */
  connect: () => Promise<void>;
  /** Disconnect from the serial port */
  disconnect: () => Promise<void>;
  /** Reconnect to a previously connected port */
  reconnect: () => Promise<void>;
}

/**
 * Hook to detect barcode scanner input via Web Serial API (USB-COM mode)
 *
 * USB-COM scanners communicate via serial port instead of keyboard emulation.
 * This provides better reliability and doesn't interfere with text inputs.
 *
 * Browser Support: Chrome 89+, Edge 89+, Opera 75+ (Chromium-based only)
 * Requires: HTTPS or localhost
 *
 * @example
 * ```tsx
 * const { isSupported, isConnected, connect, disconnect, error } = useSerialBarcodeScanner({
 *   onScan: (barcode) => console.log("Scanned:", barcode),
 *   baudRate: 9600,
 * });
 *
 * if (!isSupported) return <p>Browser doesn't support serial scanners</p>;
 *
 * return (
 *   <Button onClick={isConnected ? disconnect : connect}>
 *     {isConnected ? "Disconnect Scanner" : "Connect Scanner"}
 *   </Button>
 * );
 * ```
 */
export function useSerialBarcodeScanner({
  onScan,
  baudRate = 9600,
  dataBits = 8,
  stopBits = 1,
  parity = "none",
  enabled = true,
  lineEnding = "cr",
  autoReconnect = true,
}: SerialScannerOptions): SerialScannerReturn {
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(
    null,
  );
  const isReadingRef = useRef<boolean>(false);
  const bufferRef = useRef<string>("");

  const [state, setState] = useState<SerialScannerState>({
    isSupported: typeof navigator !== "undefined" && "serial" in navigator,
    isConnected: false,
    isConnecting: false,
    error: null,
    portInfo: null,
  });

  // Stable reference to onScan callback
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  // Determine line ending characters
  const getLineEndingChars = useCallback(() => {
    switch (lineEnding) {
      case "lf":
        return ["\n"];
      case "crlf":
        return ["\r\n"];
      case "cr":
      default:
        return ["\r", "\n"];
    }
  }, [lineEnding]);

  // Process incoming data
  const processData = useCallback(
    (text: string) => {
      const lineEndingChars = getLineEndingChars();

      for (const char of text) {
        if (lineEndingChars.includes(char)) {
          const barcode = bufferRef.current.trim();
          if (barcode.length > 0) {
            onScanRef.current(barcode);
          }
          bufferRef.current = "";
        } else if (char !== "\r" && char !== "\n") {
          // Skip any line ending chars not in our expected set
          bufferRef.current += char;
        }
      }
    },
    [getLineEndingChars],
  );

  // Read loop for incoming serial data
  const startReading = useCallback(
    async (port: SerialPort) => {
      if (!port.readable || isReadingRef.current) return;

      isReadingRef.current = true;
      const decoder = new TextDecoder();

      try {
        const reader = port.readable.getReader();
        readerRef.current = reader;

        while (isReadingRef.current) {
          const { value, done } = await reader.read();

          if (done) {
            break;
          }

          if (value) {
            const text = decoder.decode(value, { stream: true });
            processData(text);
          }
        }
      } catch (error) {
        // NetworkError is expected when port is closed
        if ((error as Error).name !== "NetworkError") {
          console.error("[SerialScanner] Read error:", error);
          setState((s) => ({
            ...s,
            error:
              error instanceof Error ? error.message : "Failed to read data",
          }));
        }
      } finally {
        isReadingRef.current = false;
        readerRef.current = null;
      }
    },
    [processData],
  );

  // Stop reading from serial port
  const stopReading = useCallback(async () => {
    isReadingRef.current = false;

    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch {
        // Ignore cancel errors
      }
      readerRef.current = null;
    }
  }, []);

  // Connect to a serial port
  const connect = useCallback(async () => {
    if (!state.isSupported) {
      setState((s) => ({
        ...s,
        error: "Web Serial API is not supported in this browser",
      }));
      return;
    }

    if (!navigator.serial) {
      setState((s) => ({ ...s, error: "Serial API not available" }));
      return;
    }

    setState((s) => ({ ...s, isConnecting: true, error: null }));

    try {
      // Request port from user (shows browser's port picker dialog)
      const port = await navigator.serial.requestPort();

      // Open the port with scanner settings
      await port.open({
        baudRate,
        dataBits,
        stopBits,
        parity,
      });

      portRef.current = port;
      const portInfo = port.getInfo();

      setState((s) => ({
        ...s,
        isConnected: true,
        isConnecting: false,
        error: null,
        portInfo,
      }));

      // Start reading data
      startReading(port);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to connect";

      // User cancelled port selection
      if ((error as Error).name === "NotFoundError") {
        setState((s) => ({
          ...s,
          isConnecting: false,
          error: null,
        }));
        return;
      }

      setState((s) => ({
        ...s,
        isConnected: false,
        isConnecting: false,
        error: errorMessage,
      }));
    }
  }, [state.isSupported, baudRate, dataBits, stopBits, parity, startReading]);

  // Disconnect from the serial port
  const disconnect = useCallback(async () => {
    await stopReading();

    if (portRef.current) {
      try {
        await portRef.current.close();
      } catch (error) {
        console.error("[SerialScanner] Close error:", error);
      }
      portRef.current = null;
    }

    bufferRef.current = "";
    setState((s) => ({
      ...s,
      isConnected: false,
      error: null,
      portInfo: null,
    }));
  }, [stopReading]);

  // Reconnect to a previously authorized port
  const reconnect = useCallback(async () => {
    if (!state.isSupported || !navigator.serial) {
      return;
    }

    setState((s) => ({ ...s, isConnecting: true, error: null }));

    try {
      const ports = await navigator.serial.getPorts();

      if (ports.length === 0) {
        setState((s) => ({
          ...s,
          isConnecting: false,
          error: "No previously connected ports found",
        }));
        return;
      }

      const port = ports[0];

      await port.open({
        baudRate,
        dataBits,
        stopBits,
        parity,
      });

      portRef.current = port;
      const portInfo = port.getInfo();

      setState((s) => ({
        ...s,
        isConnected: true,
        isConnecting: false,
        error: null,
        portInfo,
      }));

      startReading(port);
    } catch (error) {
      setState((s) => ({
        ...s,
        isConnected: false,
        isConnecting: false,
        error: error instanceof Error ? error.message : "Failed to reconnect",
      }));
    }
  }, [state.isSupported, baudRate, dataBits, stopBits, parity, startReading]);

  // Auto-reconnect to previously connected port on mount
  useEffect(() => {
    let mounted = true;

    const tryAutoReconnect = async () => {
      if (
        !autoReconnect ||
        !enabled ||
        !state.isSupported ||
        state.isConnected ||
        state.isConnecting
      ) {
        return;
      }

      try {
        const ports = await navigator.serial?.getPorts();
        if (ports && ports.length > 0 && mounted) {
          setTimeout(() => {
            if (mounted) {
              reconnect();
            }
          }, 100);
        }
      } catch {
        // Ignore errors when checking for ports
      }
    };

    tryAutoReconnect();

    return () => {
      mounted = false;
    };
  }, [autoReconnect, enabled, state.isSupported]);

  // Auto-disconnect when disabled
  useEffect(() => {
    if (!enabled && state.isConnected) {
      disconnect();
    }
  }, [enabled, state.isConnected, disconnect]);

  useEffect(() => {
    if (!state.isSupported || !autoReconnect) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (state.isConnected) {
          disconnect();
        }
      } else {
        if (!state.isConnected && !state.isConnecting && enabled) {
          setTimeout(() => {
            reconnect();
          }, 200);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    state.isSupported,
    state.isConnected,
    state.isConnecting,
    autoReconnect,
    enabled,
    disconnect,
    reconnect,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopReading();
      if (portRef.current) {
        portRef.current.close().catch(() => {
          // Ignore close errors on unmount
        });
      }
    };
  }, [stopReading]);

  return {
    ...state,
    connect,
    disconnect,
    reconnect,
  };
}

export default useSerialBarcodeScanner;
