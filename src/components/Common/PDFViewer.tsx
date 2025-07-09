import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

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
    <div className="flex h-full w-full flex-col items-center justify-center overflow-auto">
      <div className="overflow-auto max-w-full max-h-full max-md:max-w-[50vw]">
        <Document
          file={props.url}
          onLoadSuccess={({ numPages }) =>
            props.onDocumentLoadSuccess(numPages)
          }
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
