import careConfig from "@careConfig";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";
import {
  FitToWidthScrollContainer,
  ZoomProvider,
  ZoomTransform,
} from "@/CAREUI/interactive/Zoom";

import { Button } from "@/components/ui/button";

import Page from "@/components/Common/Page";

import BackButton from "@/components/Common/BackButton";
import { useShortcutSubContext } from "@/context/ShortcutContext";
import useAutoPrint from "@/hooks/useAutoPrint";
import useBreakpoints from "@/hooks/useBreakpoints";
import { FacilityRead } from "@/types/facility/facility";
import type {
  LogoConfig,
  PrintTemplate,
  WatermarkConfig,
} from "@/types/facility/printTemplate";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import { isIOSDevice } from "@/Utils/utils";

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
};

export default function PrintPreview(props: Props) {
  const isMobile = useBreakpoints({ default: true, md: false });
  const { t } = useTranslation();
  useShortcutSubContext();

  const autoPrintEnabled =
    (props.facility
      ? resolvePrintTemplate(props.facility, props.templateSlug)?.print_setup
          ?.auto_print
      : undefined) ?? false;

  const [imagesReady, setImagesReady] = useState(false);
  const printSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setImagesReady(false);
    const node = printSectionRef.current;
    if (!node || props.disabled) return;

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
      if (!cancelled) setImagesReady(true);
    };

    waitForImages();

    return () => {
      cancelled = true;
    };
  }, [props.disabled, props.facility]);

  const { isPrinting } = useAutoPrint({
    enabled: autoPrintEnabled && imagesReady && !props.disabled,
  });

  const templateWatermark = props.facility
    ? resolvePrintTemplate(props.facility, props.templateSlug)?.watermark
    : undefined;

  const printContent = (
    <div
      ref={printSectionRef}
      id="section-to-print"
      className={cn("w-full relative overflow-clip", props.className)}
    >
      {props.watermark && <StatusWatermark watermark={props.watermark} />}
      {templateWatermark?.enabled && templateWatermark.text && (
        <TiledWatermark watermark={templateWatermark} />
      )}
      <FacilityPrintLayout
        facility={props.facility}
        templateSlug={props.templateSlug}
        hideFacilityHeader={props.hideFacilityHeader}
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
          <div className="flex items-center gap-2">
            {props.showBackButton !== false && (
              <BackButton variant="outline" data-shortcut-id="go-back">
                <CareIcon icon="l-arrow-left" className="text-lg" />
                {t("back")}
              </BackButton>
            )}
            <Button
              variant="primary"
              disabled={props.disabled || isPrinting}
              onClick={print}
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
              contentClassName="bg-white p-4 text-sm min-w-[800px]"
            >
              {printContent}
            </FitToWidthScrollContainer>
          </div>
        ) : (
          <div className="mx-auto my-4 max-w-[95vw] print:max-w-none sm:my-8">
            <ZoomProvider>
              <ZoomTransform className="origin-top-left bg-white p-10 text-sm shadow-2xl transition-all duration-200 ease-in-out print:transform-none max-w-[calc(100vw-1rem)]">
                {printContent}
              </ZoomTransform>
            </ZoomProvider>
          </div>
        )}
      </Page>
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

function resolvePrintTemplate(
  facility: FacilityRead,
  templateSlug?: string,
): PrintTemplate | undefined {
  const templates = facility.print_templates;
  if (!templates?.length) return undefined;

  const match = templateSlug
    ? templates.find((t) => t.slug === templateSlug)
    : undefined;

  return match ?? templates.find((t) => t.slug === "default");
}

function buildPageStyle(template?: PrintTemplate): string | null {
  const page = template?.page;
  if (!page) return null;

  const parts: string[] = [];

  if (page.size || page.orientation) {
    const sizeParts = [page.size, page.orientation].filter(Boolean).join(" ");
    parts.push(`size: ${sizeParts}`);
  }

  if (page.margin) {
    const { top, right, bottom, left } = page.margin;
    parts.push(`margin: ${top}mm ${right}mm ${bottom}mm ${left}mm`);
  }

  if (parts.length === 0) return null;

  return `@media print { @page { ${parts.join("; ")}; } }`;
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
}: {
  templateSlug?: string;
  facility?: FacilityRead;
  children: ReactNode;
  hideFacilityHeader?: boolean;
}) {
  if (!facility) {
    return <>{children}</>;
  }

  const printTemplate = resolvePrintTemplate(facility, templateSlug);
  const headerImage = printTemplate?.branding?.header_image;
  const footerImage = printTemplate?.branding?.footer_image;
  const logo = printTemplate?.branding?.logo;
  const pageStyle = buildPageStyle(printTemplate);
  const logoUrl = logo?.url || undefined;
  const alignment = logoUrl ? (logo?.alignment ?? "right") : "right";

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] print:min-h-screen">
      {pageStyle && <style>{pageStyle}</style>}
      {hideFacilityHeader ? null : headerImage?.url ? (
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
      )}
      <div className="flex-1">{children}</div>
      {footerImage?.url && (
        <div className="mt-auto pt-2">
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
    </div>
  );
}
