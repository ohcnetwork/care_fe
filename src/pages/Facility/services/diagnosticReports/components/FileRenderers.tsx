import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export function PDFRenderer({ fileUrl }: { fileUrl: string }) {
  const [numPages, setNumPages] = useState<number>(0);
  const { t } = useTranslation();

  return (
    <div className="break-before-page">
      <Document
        file={fileUrl}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        error={<div className="text-red-500">{t("error_loading_pdf")}</div>}
        loading={<div className="text-gray-500">{t("loading")}</div>}
      >
        <div className="flex flex-col justify-center w-full">
          {Array.from(new Array(numPages), (_, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              width={Math.min(window.innerWidth * 0.9, 600)}
              scale={1.2}
            />
          ))}
        </div>
      </Document>
    </div>
  );
}

export function ImageRenderer({
  fileUrl,
  fileName,
}: {
  fileUrl: string;
  fileName?: string;
}) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="break-before-page flex flex-col justify-center w-full">
      {isLoading && (
        <div className="text-gray-500 text-center py-4">{t("loading")}</div>
      )}
      {hasError && (
        <div className="text-red-500 text-center py-4">
          {t("error_loading_image")}
        </div>
      )}
      <img
        src={fileUrl}
        alt={fileName || t("diagnostic_report_image")}
        className={`max-w-full h-auto mx-auto ${isLoading || hasError ? "hidden" : ""}`}
        style={{ maxWidth: "600px" }}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
}
