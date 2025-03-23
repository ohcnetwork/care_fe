import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

import { cn } from "@/lib/utils";

export default function PDFViewer(
  props: Readonly<{
    url: string;
    pageNumber: number;
    onDocumentLoadSuccess: (numPages: number) => void;
    scale: number;
    className?: string;
  }>,
) {
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className={cn("w-full overflow-auto", props.className)}>
        <Document
          file={props.url}
          onLoadSuccess={({ numPages }) =>
            props.onDocumentLoadSuccess(numPages)
          }
          className="w-full"
        >
          <Page
            pageNumber={props.pageNumber}
            height={650}
            scale={props.scale}
          />
        </Document>
      </div>
    </div>
  );
}
