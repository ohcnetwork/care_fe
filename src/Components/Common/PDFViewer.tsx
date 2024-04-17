import { pdfjs, Document, Page } from "react-pdf";

import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";

export default function PDFViewer(
  props: Readonly<{
    url: string;
    pageNumber: number;
    onDocumentLoadSuccess: (numPages: number) => void;
  }>
) {
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

  return (
    <div className="flex flex-col items-center justify-center">
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
