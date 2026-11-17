import {
  ArrowLeft,
  CircleAlert,
  Download,
  Printer,
  Share2,
  TriangleAlert,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import BackButton from "@/components/Common/BackButton";
import Page from "@/components/Common/Page";

import { useShortcutSubContext } from "@/context/ShortcutContext";
import { PdfPages } from "@/print/PdfPages";
import {
  downloadPdf,
  getPdfPrintMethod,
  pdfFileName,
  sharePdf,
} from "@/print/printPdf";
import { TypstCompileError } from "@/print/typstClient";
import { type TypstPdfOptions, useTypstPdf } from "@/print/useTypstPdf";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";

const ASSET_LABELS = {
  logo: "logo",
  headerImage: "header_image",
  footerImage: "footer_image",
} as const;

interface Props<TContent> extends TypstPdfOptions<TContent> {
  showBackButton?: boolean;
}

/**
 * Print preview for documents generated as PDFs with Typst (see src/print).
 * Shows the generated pages, and prints, shares or downloads the PDF.
 */
export default function TypstPrintPreview<TContent>({
  showBackButton,
  ...options
}: Props<TContent>) {
  const { t } = useTranslation();
  useShortcutSubContext();

  const { pdf, error, isLoading, retry, failedAssets, autoPrint } =
    useTypstPdf(options);

  const url = useMemo(
    () =>
      pdf
        ? URL.createObjectURL(
            new Blob([pdf as BlobPart], { type: "application/pdf" }),
          )
        : undefined,
    [pdf],
  );
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  const fileName = pdfFileName(options.title);
  const method = useMemo(() => getPdfPrintMethod(), []);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loadedUrl, setLoadedUrl] = useState<string>();
  const iframeLoaded = !!url && loadedUrl === url;

  const print = useCallback(() => {
    if (!pdf || !url) return;
    if (method === "share") {
      void sharePdf(pdf, url, fileName);
      return;
    }
    const frame = iframeRef.current?.contentWindow;
    if (method === "iframe" && frame && iframeLoaded) {
      frame.focus();
      frame.print();
      return;
    }
    window.open(url, "_blank", "noopener");
  }, [pdf, url, method, fileName, iframeLoaded]);

  // The print dialog can only open by itself from the hidden iframe; other
  // methods need a click.
  const autoPrinted = useRef(false);
  useEffect(() => {
    if (
      autoPrint &&
      method === "iframe" &&
      iframeLoaded &&
      !autoPrinted.current
    ) {
      autoPrinted.current = true;
      print();
    }
  }, [autoPrint, method, iframeLoaded, print]);

  // Ctrl/Cmd+P prints the document rather than this page.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "p") {
        event.preventDefault();
        print();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [print]);

  return (
    <div className="flex items-center justify-center max-w-6xl mx-auto">
      <Page
        title={options.title}
        options={
          <div className="flex items-center gap-2">
            {showBackButton !== false && (
              <BackButton variant="outline" data-shortcut-id="go-back">
                <ArrowLeft />
                {t("back")}
              </BackButton>
            )}
            <Button
              variant="outline"
              disabled={!url}
              onClick={() => url && downloadPdf(url, fileName)}
            >
              <Download />
              {t("download")}
            </Button>
            <Button
              variant="primary"
              disabled={!url}
              onClick={print}
              data-shortcut-id="print-button"
            >
              {method === "share" ? <Share2 /> : <Printer />}
              {method === "share" ? t("share") : t("print")}
              <ShortcutBadge actionId="print-button" className="bg-white" />
            </Button>
          </div>
        }
      >
        {/* A definite width: the page layout shrinks to fit its content,
            and the PDF viewer sizes pages to this container. */}
        <div className="mx-auto my-4 sm:my-8 flex w-[min(56rem,calc(100vw-2rem))] flex-col gap-4">
          {failedAssets.length > 0 && (
            <Alert variant="warning">
              <TriangleAlert />
              <AlertTitle>{t("print_images_unavailable")}</AlertTitle>
              <AlertDescription>
                {t("print_images_unavailable_description", {
                  images: failedAssets
                    .map((asset) => t(ASSET_LABELS[asset]))
                    .join(", "),
                })}
              </AlertDescription>
            </Alert>
          )}

          {error ? (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertTitle>{t("pdf_generation_failed")}</AlertTitle>
              <AlertDescription>
                <p>{error.message}</p>
                {import.meta.env.DEV &&
                  error instanceof TypstCompileError &&
                  error.diagnostics.length > 0 && (
                    <pre className="mt-2 max-w-full overflow-x-auto whitespace-pre-wrap text-xs">
                      {error.diagnostics.join("\n")}
                    </pre>
                  )}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => retry()}
                >
                  {t("retry")}
                </Button>
              </AlertDescription>
            </Alert>
          ) : isLoading || !url ? (
            <div className="flex flex-col items-center gap-2 py-24 text-center">
              <Spinner className="size-6" />
              <p className="text-sm font-medium">{t("preparing_document")}</p>
              <p className="max-w-sm text-xs text-gray-500">
                {t("preparing_document_hint")}
              </p>
            </div>
          ) : (
            <>
              <PdfPages url={url} />
              {method === "iframe" && (
                <iframe
                  ref={iframeRef}
                  src={url}
                  title={options.title}
                  aria-hidden="true"
                  tabIndex={-1}
                  onLoad={() => setLoadedUrl(url)}
                  // Chrome doesn't load PDFs in display:none frames.
                  className="pointer-events-none fixed bottom-0 right-0 size-px opacity-0"
                />
              )}
            </>
          )}
        </div>
      </Page>
    </div>
  );
}
