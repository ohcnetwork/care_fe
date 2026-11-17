import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";

import { serializeSvg } from "@/print/printAssets";

/** Typst can't draw QR codes: render `element` and pass `files` to the preview. */
export function useQrCode(value: string, path: string, size: number) {
  const ref = useRef<SVGSVGElement>(null);
  const [bytes, setBytes] = useState<Uint8Array>();

  useEffect(() => {
    if (ref.current) setBytes(serializeSvg(ref.current));
  }, [value]);

  return {
    element: (
      <div hidden>
        <QRCodeSVG ref={ref} value={value} size={size} marginSize={0} />
      </div>
    ),
    files: bytes ? { [path]: bytes } : undefined,
    ready: !!bytes,
  };
}
