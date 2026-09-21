import careConfig from "@careConfig";
import { FileDown } from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { FitToWidthScrollContainer } from "@/CAREUI/interactive/FitToWidthScrollContainer";
import { PrintPage } from "@/CAREUI/misc/PrintPage";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import Page from "@/components/Common/Page";

import BackButton from "@/components/Common/BackButton";
import { useShortcutSubContext } from "@/context/ShortcutContext";
import useAutoPrint from "@/hooks/useAutoPrint";
import useBreakpoints from "@/hooks/useBreakpoints";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import { FacilityRead } from "@/types/facility/facility";
import type {
  LogoConfig,
  PageConfig,
  WatermarkConfig,
} from "@/types/facility/printTemplate";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import { getPrintPage, resolvePrintTemplate } from "@/Utils/print";
import { isIOSDevice } from "@/Utils/utils";

import "./print.css";

interface WatermarkProps {
  text: string;
  color?: "red" | "gray" | "yellow";
}

type Props = {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  title: string;
  showBackButton?: boolean;
  watermark?: WatermarkProps;
  facility?: FacilityRead;
  templateSlug: string;
  hideFacilityHeader?: boolean;
  footer?: ReactNode;
  autoPrint?: boolean;
  defaultPage?: PageConfig;
};

export default function PrintPreview(props: Props) {
  const { facility: currentFacility, facilityId } =
    useCurrentFacilitySilently();
  const facility = props.facility ?? currentFacility ?? undefined;
  const disabled = props.disabled || (!!facilityId && !facility);
  const isMobile = useBreakpoints({ default: true, md: false });
  const { t } = useTranslation();
  useShortcutSubContext();

  const template = resolvePrintTemplate(
    facility?.print_templates,
    props.templateSlug,
  );
  const page = getPrintPage(template, props.defaultPage);
  const autoPrintEnabled =
    props.autoPrint ?? template?.print_setup?.auto_print ?? false;
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);

  const [imagesReady, setImagesReady] = useState(false);
  const printSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setImagesReady(false);
    const node = printSectionRef.current;
    if (!node || disabled) return;

    let cancelled = false;

    const waitForImages = async () => {
      const images = Array.from(node.querySelectorAll("img"));
      await Promise.all(
        images.map((img) =>
          img.complete
            ? Promise.resolve()
            : img.decode().catch(() => undefined),
        ),
      );
      await document.fonts.ready;
      if (!cancelled) setImagesReady(true);
    };

    waitForImages();

    return () => {
      cancelled = true;
    };
  }, [disabled, facility, props.templateSlug, props.children]);

  const { isPrinting } = useAutoPrint({
    enabled: autoPrintEnabled && imagesReady && !disabled,
  });

  const templateWatermark = template?.watermark;

  const handlePrint = () => {
    if (disabled || isPrinting || !imagesReady) return;
    const previousTitle = document.title;
    document.title = props.title;
    try {
      window.print();
    } finally {
      document.title = previousTitle;
    }
  };

  const printContent = (
    <div
      ref={printSectionRef}
      id="section-to-print"
      className={cn("relative", props.className)}
      style={{ width: `${page.contentWidth}mm` }}
    >
      {props.watermark && <StatusWatermark watermark={props.watermark} />}
      {templateWatermark?.enabled && templateWatermark.text && (
        <TiledWatermark watermark={templateWatermark} />
      )}
      <FacilityPrintLayout
        facility={facility}
        templateSlug={props.templateSlug}
        hideFacilityHeader={props.hideFacilityHeader}
        footer={props.footer}
        defaultPage={props.defaultPage}
      >
        {props.children}
      </FacilityPrintLayout>
    </div>
  );

  return (
    <div className="flex items-center justify-center max-w-6xl mx-auto">
      <Page
        title={props.title}
        options={
          <div className="flex flex-wrap items-center gap-2">
            {props.showBackButton !== false && (
              <BackButton variant="outline" data-shortcut-id="go-back">
                <CareIcon icon="l-arrow-left" className="text-lg" />
                {t("back")}
              </BackButton>
            )}
            <Button
              variant="outline"
              disabled={disabled || isPrinting || !imagesReady}
              onClick={() => setPdfDialogOpen(true)}
            >
              <FileDown className="size-4" />
              {t("print_export_pdf")}
            </Button>
            <Button
              variant="primary"
              disabled={disabled || isPrinting || !imagesReady}
              onClick={handlePrint}
            >
              <CareIcon icon="l-print" className="text-lg" />
              {t("print")}
              <ShortcutBadge actionId="print-button" className="bg-white" />
            </Button>
          </div>
        }
      >
        {isMobile ? (
          <div className="mt-4 print:max-w-none">
            <FitToWidthScrollContainer
              className="w-[95vw] mx-2 shadow-2xl"
              contentClassName="bg-white p-4 text-sm"
            >
              {printContent}
            </FitToWidthScrollContainer>
          </div>
        ) : (
          <div className="mx-auto my-4 overflow-auto print:max-w-none sm:my-8 origin-top-left bg-white p-10 text-sm shadow-2xl print:transform-none max-w-[calc(100vw-1rem)]">
            {printContent}
          </div>
        )}
      </Page>
      <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("print_export_pdf")}</DialogTitle>
            <DialogDescription>{t("print_export_pdf_help")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPdfDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={() => {
                setPdfDialogOpen(false);
                requestAnimationFrame(handlePrint);
              }}
            >
              {t("continue")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const TILE_W = 220;
const TILE_H = 100;

function StatusWatermark({ watermark }: { watermark: WatermarkProps }) {
  const colorClass = cn(
    watermark.color === "red" && "text-red-600",
    watermark.color === "gray" && "text-gray-600",
    watermark.color === "yellow" && "text-yellow-600",
    !watermark.color && "text-red-600",
  );

  return (
    <>
      {/* Print: fixed so the browser stamps it on every page (absolute on iOS where fixed print is broken) */}
      <div
        className={cn(
          "print:flex",
          isIOSDevice ? "absolute" : "fixed",
          "inset-0 flex items-center justify-center select-none pointer-events-none z-10",
        )}
      >
        <span
          className={cn(
            "text-6xl font-bold uppercase tracking-widest opacity-20 -rotate-30 whitespace-nowrap",
            colorClass,
          )}
        >
          {watermark.text}
        </span>
      </div>
    </>
  );
}

function buildWatermarkSvg(text: string, rotation: number): string {
  const encoded = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  return `<svg xmlns='http://www.w3.org/2000/svg' width='${TILE_W}' height='${TILE_H}'><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' transform='rotate(${rotation} ${TILE_W / 2} ${TILE_H / 2})' font-size='12' font-weight='600' font-family='sans-serif' letter-spacing='2' fill='currentColor'>${encoded}</text></svg>`;
}

function TiledWatermark({ watermark }: { watermark: WatermarkConfig }) {
  const opacity = watermark.opacity ?? 0.08;
  const rotation = watermark.rotation ?? -30;
  const svg = buildWatermarkSvg(watermark.text!, rotation);
  const dataUri = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

  return (
    <>
      <div
        className="absolute inset-0 select-none pointer-events-none z-10 text-gray-900 print:hidden"
        aria-hidden="true"
        style={{
          backgroundImage: dataUri,
          backgroundRepeat: "repeat",
          backgroundSize: `${TILE_W}px ${TILE_H}px`,
          opacity,
        }}
      />
      <div
        className={cn(
          "hidden print:block inset-0 select-none pointer-events-none z-10 text-gray-900",
          isIOSDevice ? "absolute" : "fixed",
        )}
        aria-hidden="true"
        style={{
          backgroundImage: dataUri,
          backgroundRepeat: "repeat",
          backgroundSize: `${TILE_W}px ${TILE_H}px`,
          opacity,
        }}
      />
    </>
  );
}

function FacilityInfo({ facility }: { facility: FacilityRead }) {
  return (
    <div className="text-left">
      <h1 className="text-2xl font-semibold">{facility.name}</h1>
      <div className="text-gray-500 whitespace-pre-wrap wrap-break-word text-xs">
        {facility.address}
        <p className="text-gray-500 text-xs">{facility.phone_number}</p>
      </div>
    </div>
  );
}

function FacilityLogo({
  logoUrl,
  logo,
}: {
  logoUrl?: string;
  logo?: LogoConfig;
}) {
  const hasCustomDims = !!(logoUrl && (logo?.width || logo?.height));

  return (
    <img
      src={logoUrl ?? careConfig.mainLogo?.dark}
      alt={logoUrl ? "Facility brand mark" : "Care Logo"}
      className={cn(
        "object-contain mb-2 sm:mb-0",
        !hasCustomDims && "h-10 w-auto",
      )}
      style={
        logoUrl
          ? {
              ...(logo?.width ? { width: `${logo.width}px` } : {}),
              ...(logo?.height ? { height: `${logo.height}px` } : {}),
            }
          : undefined
      }
    />
  );
}

function FacilityPrintLayout({
  templateSlug,
  facility,
  children,
  hideFacilityHeader,
  footer,
  defaultPage,
}: {
  templateSlug?: string;
  facility?: FacilityRead;
  children: ReactNode;
  hideFacilityHeader?: boolean;
  footer?: ReactNode;
  defaultPage?: PageConfig;
}) {
  const printTemplate = resolvePrintTemplate(
    facility?.print_templates,
    templateSlug ?? "default",
  );
  const headerImage = printTemplate?.branding?.header_image;
  const footerImage = printTemplate?.branding?.footer_image;
  const logo = printTemplate?.branding?.logo;
  const logoUrl = logo?.url || undefined;
  const alignment = logoUrl ? (logo?.alignment ?? "right") : "right";

  const header = hideFacilityHeader ? null : headerImage?.url ? (
    <div className="flex justify-between items-start mb-2 pb-2">
      <img
        src={headerImage.url}
        alt="Custom Header"
        className="flex-1 h-auto object-contain max-w-3xl"
        style={
          headerImage.height
            ? { maxHeight: `${headerImage.height}px` }
            : undefined
        }
      />
    </div>
  ) : !facility ? (
    <div className="mb-3 pb-2 border-b border-gray-200">
      <FacilityLogo logoUrl={logoUrl} logo={logo} />
    </div>
  ) : alignment === "center" ? (
    <div className="flex flex-col items-center mb-3 pb-2 border-b border-gray-200 gap-2">
      <FacilityLogo logoUrl={logoUrl} logo={logo} />
      <div className="w-full">
        <FacilityInfo facility={facility} />
      </div>
    </div>
  ) : (
    <div className="flex justify-between items-start mb-3 pb-2 border-b border-gray-200">
      {alignment === "left" ? (
        <>
          <FacilityLogo logoUrl={logoUrl} logo={logo} />
          <FacilityInfo facility={facility} />
        </>
      ) : (
        <>
          <FacilityInfo facility={facility} />
          <FacilityLogo logoUrl={logoUrl} logo={logo} />
        </>
      )}
    </div>
  );

  return (
    <PrintPage
      template={printTemplate}
      defaultPage={defaultPage}
      header={header}
      footer={
        footerImage?.url || footer ? (
          <>
            {footerImage?.url && (
              <div>
                <img
                  src={footerImage.url}
                  alt="Footer"
                  className="w-full h-auto object-contain"
                  style={
                    footerImage.height
                      ? { maxHeight: `${footerImage.height}px` }
                      : undefined
                  }
                />
              </div>
            )}
            {footer}
          </>
        ) : undefined
      }
    >
      {children}
    </PrintPage>
  );
}
