import { pdfjs } from "react-pdf";

import { fetchPrintImage } from "@/print/printAssets";

import "@/lib/pdfWorker";

/** Wide enough for a printed page; keeps the files small. */
const MAX_WIDTH = 1600;

async function canvasToJpeg(canvas: HTMLCanvasElement) {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85),
  );
  if (!blob) throw new Error("Couldn't encode the attachment");
  return new Uint8Array(await blob.arrayBuffer());
}

async function imageToJpeg(url: string) {
  // Normalises every format to JPEG; throws if the image can't be read.
  const bytes = await fetchPrintImage(url);
  const bitmap = await createImageBitmap(new Blob([bytes as BlobPart]));
  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return [await canvasToJpeg(canvas)];
}

async function pdfToJpegs(url: string) {
  const document = await pdfjs.getDocument({ url }).promise;
  const pages: Uint8Array[] = [];
  for (let number = 1; number <= document.numPages; number++) {
    const page = await document.getPage(number);
    const scale = MAX_WIDTH / page.getViewport({ scale: 1 }).width;
    const viewport = page.getViewport({ scale });
    const canvas = window.document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    await page.render({
      canvasContext: canvas.getContext("2d")!,
      viewport,
      canvas,
    }).promise;
    pages.push(await canvasToJpeg(canvas));
  }
  return pages;
}

export interface ReportAttachment {
  reportId: string;
  fileId: string;
  url: string;
  isPdf: boolean;
}

/**
 * Renders attachments (PDFs and images) to one JPEG per page. An attachment
 * that can't be read is reported in `failedFileIds` instead of failing the rest.
 */
export async function renderReportAttachments(attachments: ReportAttachment[]) {
  const files: Record<string, Uint8Array> = {};
  const paths: Record<string, string[]> = {};
  const failedFileIds: string[] = [];
  // One at a time: each page is rasterised on a large canvas.
  for (const { reportId, fileId, url, isPdf } of attachments) {
    let pages: Uint8Array[];
    try {
      pages = isPdf ? await pdfToJpegs(url) : await imageToJpeg(url);
    } catch (error) {
      console.warn(`Print: couldn't render attachment ${fileId}`, error);
      failedFileIds.push(fileId);
      continue;
    }
    pages.forEach((bytes, index) => {
      const path = `/assets/attachment-${fileId}-${index}.jpg`;
      files[path] = bytes;
      (paths[reportId] ??= []).push(path);
    });
  }
  return { files, paths, failedFileIds };
}
