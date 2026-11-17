import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Document, Page } from "react-pdf";

import { Spinner } from "@/components/ui/spinner";

import "@/lib/pdfWorker";

/** Widest a page is drawn on screen, in px. */
const MAX_PAGE_WIDTH = 900;

/** Shows every page of a PDF, sized to fit the container's width. */
export function PdfPages({ url }: { url: string }) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>();
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      <Document
        file={url}
        onLoadSuccess={({ numPages }) => setPageCount(numPages)}
        loading={
          <div className="flex justify-center py-16">
            <Spinner className="size-6" />
          </div>
        }
        error={
          <p className="py-16 text-center text-sm text-red-600">
            {t("error_loading_pdf")}
          </p>
        }
      >
        {width !== undefined &&
          Array.from({ length: pageCount }, (_, i) => (
            <Page
              key={i}
              pageNumber={i + 1}
              width={Math.min(width, MAX_PAGE_WIDTH)}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="mx-auto mb-6 w-fit bg-white shadow-2xl"
            />
          ))}
      </Document>
    </div>
  );
}
