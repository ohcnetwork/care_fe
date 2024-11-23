import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

export default function PDFViewer(
  props: Readonly<{
    url: string;
    pageNumber: number;
    onDocumentLoadSuccess: (numPages: number) => void;
  }>,
) {
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="w-full overflow-auto">
        <Document
          file={props.url}
          onLoadSuccess={({ numPages }) =>
            props.onDocumentLoadSuccess(numPages)
          }
          className="w-full"
        >
          <Page pageNumber={props.pageNumber} height={650} />
        </Document>
      </div>
    </div>
  );
}
