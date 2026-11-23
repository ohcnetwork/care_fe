import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Document, Page } from "react-pdf";

import { Skeleton } from "@/components/ui/skeleton";

import PrintLoading from "@/CAREUI/misc/PrintLoading";

import "react-pdf/dist/Page/TextLayer.css";

import "@/lib/pdfWorker";

const MAX_PAGE_WIDTH = 900;

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
        suspense={false}
        onLoadSuccess={({ numPages }) => setPageCount(numPages)}
        loading={<PrintLoading />}
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
              renderAnnotationLayer={false}
              loading={
                <Skeleton className="mx-auto mb-6 aspect-210/297 w-full rounded-md" />
              }
              className="mx-auto mb-6 w-fit overflow-hidden rounded-sm bg-white shadow-xl"
            />
          ))}
      </Document>
    </div>
  );
}
