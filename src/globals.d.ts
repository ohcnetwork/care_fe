declare const __CUSTOM_DESCRIPTION_HTML__: string | undefined;

declare module "__federation__" {
  export const __federation_method_getRemote: (
    name: string,
    path: string,
  ) => Promise<any>;
  export const __federation_method_setRemote: (
    name: string,
    config: {
      url: () => Promise<string>;
      format: string;
      from: string;
      externalType: string;
    },
  ) => void;
  export const __federation_method_unwrapDefault: <T>(module: T) => T;
}

// Web Serial API Types for USB-COM barcode scanners
interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

interface SerialOptions {
  baudRate: number;
  dataBits?: 7 | 8;
  stopBits?: 1 | 2;
  parity?: "none" | "even" | "odd";
  bufferSize?: number;
  flowControl?: "none" | "hardware";
}

interface SerialPort extends EventTarget {
  readonly readable: ReadableStream<Uint8Array> | null;
  readonly writable: WritableStream<Uint8Array> | null;
  getInfo(): SerialPortInfo;
  open(options: SerialOptions): Promise<void>;
  close(): Promise<void>;
}

interface SerialPortRequestOptions {
  filters?: SerialPortFilter[];
}

interface SerialPortFilter {
  usbVendorId?: number;
  usbProductId?: number;
}

interface Serial extends EventTarget {
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
  getPorts(): Promise<SerialPort[]>;
}

interface Navigator {
  readonly serial?: Serial;
}
