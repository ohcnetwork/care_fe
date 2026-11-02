import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Document, Page } from "react-pdf";

import "@/lib/pdfWorker";

// Fixed printable page width (px). The rendered PDF/image sizes the paper, not
// the screen, so this must not depend on the (non-reactive) viewport width.
const PRINT_PAGE_WIDTH = 600;

export interface AttachmentRendererProps {
  fileUrl: string;
  onReady: (fileUrl: string) => void;
  onError: (fileUrl: string) => void;
}

// TODO: Replace with PDFViewer
export default function DiagnosticReportPDFRenderer({
  fileUrl,
  onReady,
  onError,
}: AttachmentRendererProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const renderedPages = useRef(new Set<number>());
  const { t } = useTranslation();

  return (
    <div className="break-before-page">
      <Document
        file={fileUrl}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadError={() => onError(fileUrl)}
        onSourceError={() => onError(fileUrl)}
        error={<div className="text-red-500">{t("error_loading_pdf")}</div>}
        loading={<div className="text-muted-foreground">{t("loading")}</div>}
      >
        <div className="flex flex-col justify-center w-full">
          {Array.from(new Array(numPages), (_, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              width={PRINT_PAGE_WIDTH}
              scale={1.2}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              onRenderSuccess={() => {
                renderedPages.current.add(index);
                if (renderedPages.current.size === numPages) {
                  onReady(fileUrl);
                }
              }}
              onLoadError={() => onError(fileUrl)}
              onRenderError={() => onError(fileUrl)}
            />
          ))}
        </div>
      </Document>
    </div>
  );
}
