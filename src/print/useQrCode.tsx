import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";

import { serializeSvg } from "@/print/printAssets";

/** Replaces the three square corner markers with rounded ones. */
function roundFinders(svg: SVGSVGElement) {
  const n = Number(svg.getAttribute("viewBox")?.split(" ")[2]);
  // Room for the white squares that cover the old markers; the SVG clips at its edge.
  svg.setAttribute("viewBox", `-0.5 -0.5 ${n + 1} ${n + 1}`);
  const rect = (inset: number, side: number, rx: number, fill: string) =>
    `<rect x="${inset}" y="${inset}" width="${side}" height="${side}" rx="${rx}" fill="${fill}"/>`;
  const finder = [
    rect(-0.2, 7.4, 0, "#fff"),
    rect(0, 7, 2, "#000"),
    rect(1, 5, 1.2, "#fff"),
    rect(2, 3, 0.8, "#000"),
  ].join("");
  for (const [x, y] of [
    [0, 0],
    [n - 7, 0],
    [0, n - 7],
  ]) {
    svg.insertAdjacentHTML(
      "beforeend",
      `<g transform="translate(${x} ${y})">${finder}</g>`,
    );
  }
}

/** Typst can't draw QR codes: render `element` and pass `files` to the preview. */
export function useQrCode(value: string, path: string, size: number) {
  const ref = useRef<SVGSVGElement>(null);
  const [bytes, setBytes] = useState<Uint8Array>();

  useEffect(() => {
    if (!ref.current) return;
    const svg = ref.current.cloneNode(true) as SVGSVGElement;
    roundFinders(svg);
    setBytes(serializeSvg(svg));
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
