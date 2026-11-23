import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, Printer, Share2, TriangleAlert } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import BackButton from "@/components/Common/BackButton";
import PageTitle from "@/components/Common/PageTitle";

import PrintLoading from "@/CAREUI/misc/PrintLoading";
import { useShortcutSubContext } from "@/context/ShortcutContext";
import { PdfPages } from "@/print/PdfPages";
import {
  getPdfPrintMethod,
  sharePdf,
  waitForPrintDialogToClose,
} from "@/print/printPdf";
import { TypstCompileError } from "@/print/typstClient";
import { type TypstPdfOptions, useTypstPdf } from "@/print/useTypstPdf";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import { isTouchDevice } from "@/Utils/utils";

const ASSET_LABELS = {
  logo: "logo",
  headerImage: "header_image",
  footerImage: "footer_image",
} as const;

interface Props<TContent> extends TypstPdfOptions<TContent> {
  showBackButton?: boolean;
  /** Shown above the pages, e.g. options that change the document. */
  toolbar?: ReactNode;
  /** Shows the preview but blocks printing, e.g. when the document is incomplete. */
  printDisabled?: boolean;
}

export default function TypstPrintPreview<TContent>({
  showBackButton,
  toolbar,
  printDisabled,
  ...options
}: Props<TContent>) {
  const { t } = useTranslation();
  const router = useRouter();
  useShortcutSubContext();

  const { pdf, error, isLoading, isFetching, retry, failedAssets, autoPrint } =
    useTypstPdf(options);

  const [url, setUrl] = useState<string>();
  useEffect(() => {
    const objectUrl = pdf
      ? URL.createObjectURL(
          new Blob([pdf as BlobPart], { type: "application/pdf" }),
        )
      : undefined;
    setUrl(objectUrl);
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [pdf]);

  const method = useMemo(() => getPdfPrintMethod(), []);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loadedUrl, setLoadedUrl] = useState<string>();
  const iframeLoaded = !!url && loadedUrl === url;

  const print = useCallback(() => {
    if (!url || printDisabled) return;
    if (method === "share") {
      if (pdf) void sharePdf(pdf, options.title);
      return;
    }
    const frame = iframeRef.current?.contentWindow;
    if (method === "iframe" && frame && iframeLoaded) {
      frame.focus();
      frame.print();
      return;
    }
    window.open(url, "_blank", "noopener");
  }, [url, pdf, options.title, method, iframeLoaded, printDisabled]);

  // The print dialog can only open by itself from the hidden iframe; other
  // methods need a click.
  const autoPrinted = useRef(false);
  useEffect(() => {
    if (
      autoPrint &&
      !printDisabled &&
      method === "iframe" &&
      iframeLoaded &&
      !autoPrinted.current
    ) {
      autoPrinted.current = true;
      print();
      void waitForPrintDialogToClose().then(() => {
        if (!isTouchDevice && router.history.canGoBack()) router.history.back();
      });
    }
  }, [autoPrint, printDisabled, method, iframeLoaded, print, router]);

  return (
    <div className="min-w-0">
      <div className="sticky top-0 z-20 -mx-4 bg-soft-background px-4 py-4 md:-mx-6 md:px-6">
        <PageTitle
          title={options.title}
          isInsidePage
          actions={
            <div className="flex items-center gap-2">
              {showBackButton !== false && (
                <BackButton variant="outline">
                  <ArrowLeft />
                  {t("back")}
                  <ShortcutBadge actionId="cancel-action" />
                </BackButton>
              )}
              <Button
                variant="primary"
                disabled={!url || printDisabled}
                onClick={print}
                data-shortcut-id="print-button"
              >
                {method === "share" ? <Share2 /> : <Printer />}
                {method === "share" ? t("share") : t("print")}
                <ShortcutBadge actionId="print-button" className="bg-white" />
              </Button>
            </div>
          }
        />
      </div>
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto my-4 sm:my-8 flex w-full max-w-4xl flex-col gap-4">
          {toolbar}
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

          {error && !isFetching ? (
            <Alert variant="destructive">
              <TriangleAlert />
              <AlertTitle>{t("pdf_generation_failed")}</AlertTitle>
              <AlertDescription>
                <p>{t("pdf_generation_failed_description")}</p>
                {import.meta.env.DEV && (
                  <pre className="mt-2 max-w-full overflow-x-auto whitespace-pre-wrap text-xs">
                    {[
                      error.message,
                      ...(error instanceof TypstCompileError
                        ? error.diagnostics
                        : []),
                    ].join("\n")}
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
          ) : isLoading || isFetching || !url ? (
            <PrintLoading />
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
      </div>
    </div>
  );
}
