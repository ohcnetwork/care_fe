import careConfig from "@careConfig";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { ZoomProvider, ZoomTransform } from "@/CAREUI/interactive/Zoom";

import { Button } from "@/components/ui/button";

import Page from "@/components/Common/Page";

import { useShortcutSubContext } from "@/context/ShortcutContext";
import useAppHistory from "@/hooks/useAppHistory";
import useAutoPrint, { AutoPrintOptions } from "@/hooks/useAutoPrint";
import useBreakpoints from "@/hooks/useBreakpoints";
import { FacilityRead } from "@/types/facility/facility";
import type { PrintTemplate } from "@/types/facility/printTemplate";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";

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
  autoPrint?: AutoPrintOptions;
  facility?: FacilityRead;
  templateSlug?: string;
};

export default function PrintPreview(props: Props) {
  const initialScale = useBreakpoints({ default: 0.44, md: 1 });
  const { goBack } = useAppHistory();
  const { t } = useTranslation();
  useShortcutSubContext();

  const autoPrintPreference = props.facility?.print_templates?.find(
    (t) => t.slug === (props.templateSlug ?? "default"),
  )?.print_setup?.auto_print;

  const { isPrinting } = useAutoPrint({
    ...props.autoPrint,
    enabled:
      autoPrintPreference !== undefined
        ? autoPrintPreference
        : (props.autoPrint?.enabled ?? false) && !props.disabled,
  });

  return (
    <div className="flex items-center justify-center">
      <Page
        title={props.title}
        options={
          <div className="flex items-center gap-2">
            {props.showBackButton !== false && (
              <Button
                variant="outline"
                onClick={() => goBack()}
                data-shortcut-id="go-back"
              >
                <CareIcon icon="l-arrow-left" className="text-lg" />
                {t("back")}
              </Button>
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
        <div className="mx-auto my-4 max-w-[95vw] print:max-w-none sm:my-8">
          <ZoomProvider initialScale={initialScale}>
            <ZoomTransform className="origin-top-left bg-white p-10 text-sm shadow-2xl transition-all duration-200 ease-in-out print:transform-none max-w-[calc(100vw-1rem)]">
              <div
                id="section-to-print"
                className={cn("w-full relative", props.className)}
              >
                {props.watermark && (
                  <div
                    className={cn(
                      "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-30",
                      "text-6xl font-bold uppercase tracking-widest opacity-20 select-none pointer-events-none z-10 whitespace-nowrap",
                      props.watermark.color === "red" && "text-red-600",
                      props.watermark.color === "gray" && "text-gray-600",
                      props.watermark.color === "yellow" && "text-yellow-600",
                      !props.watermark.color && "text-red-600",
                    )}
                  >
                    {props.watermark.text}
                  </div>
                )}
                <FacilityPrintLayout
                  facility={props.facility}
                  templateSlug={props.templateSlug}
                >
                  {props.children}
                </FacilityPrintLayout>
              </div>
            </ZoomTransform>
          </ZoomProvider>
        </div>
      </Page>
    </div>
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

function FacilityPrintLayout({
  templateSlug,
  facility,
  children,
}: {
  templateSlug?: string;
  facility?: FacilityRead;
  children: ReactNode;
}) {
  if (!facility) {
    return <>{children}</>;
  }

  const printTemplate = resolvePrintTemplate(facility, templateSlug);
  const headerImage = printTemplate?.branding?.header_image;
  const footerImage = printTemplate?.branding?.footer_image;
  const pageStyle = buildPageStyle(printTemplate);

  return (
    <>
      {pageStyle && <style>{pageStyle}</style>}
      {headerImage?.url ? (
        <div className="flex justify-between items-start mb-4 pb-2">
          <img
            src={headerImage.url}
            alt="Custom Header"
            className="flex-1 h-auto object-contain"
            style={
              headerImage.height
                ? { maxHeight: `${headerImage.height}px` }
                : undefined
            }
          />
        </div>
      ) : (
        <div className="flex justify-between items-start mb-4 pb-2 border-b border-gray-200">
          <div className="text-left">
            <h1 className="text-2xl font-semibold">{facility.name}</h1>
            {facility.address && (
              <div className="text-gray-500 whitespace-pre-wrap wrap-break-word text-xs">
                {facility.address}
                {facility.phone_number && (
                  <p className="text-gray-500 text-xs">
                    {facility.phone_number}
                  </p>
                )}
              </div>
            )}
          </div>
          <img
            src={careConfig.mainLogo?.dark}
            alt="Care Logo"
            className="h-8 w-auto object-contain mb-2 sm:mb-0"
          />
        </div>
      )}
      {children}
      {footerImage?.url && (
        <div className="mt-4 pt-2">
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
    </>
  );
}
