/** Image formats the Typst compiler reads; any other fails the whole document. */
type ImageFormat = "png" | "jpg" | "gif" | "webp" | "svg";

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((byte, i) => bytes[offset + i] === byte);

export function detectImageFormat(bytes: Uint8Array): ImageFormat | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47])) return "png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpg";
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return "gif";
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return "webp";
  }
  // TextDecoder drops a leading byte order mark.
  const head = new TextDecoder()
    .decode(bytes.subarray(0, 1024))
    .trimStart()
    .toLowerCase();
  if (
    head.startsWith("<svg") ||
    (head.startsWith("<?xml") && head.includes("<svg"))
  ) {
    return "svg";
  }
  return null;
}

/** Reads an image's bytes, so other origins need to allow CORS. */
export async function fetchPrintImage(url: string): Promise<Uint8Array> {
  const response = await fetch(new URL(url, window.location.href), {
    mode: "cors",
    credentials: "omit",
  });
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: HTTP ${response.status}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!detectImageFormat(bytes)) {
    throw new Error(`Unsupported image format: ${url}`);
  }
  return bytes;
}

export function serializeSvg(element: SVGSVGElement): Uint8Array {
  return new TextEncoder().encode(
    new XMLSerializer().serializeToString(element),
  );
}
