import type { TFunction } from "i18next";

import type { FacilityRead } from "@/types/facility/facility";
import type { PageConfig, PrintTemplate } from "@/types/facility/printTemplate";

import type { PrintLayout, StatusWatermark, TypstPaper } from "@/print/types";

/**
 * The facility's print template for `templateSlug`, falling back to its
 * `default` template.
 */
export function resolvePrintTemplate(
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

const PAPERS: Record<NonNullable<PageConfig["size"]>, TypstPaper> = {
  A4: "a4",
  A5: "a5",
  Letter: "us-letter",
  Legal: "us-legal",
};

/** Used when a template doesn't configure margins. */
const DEFAULT_MARGIN_MM = 10;

/** Where branding images are placed in the compiler's virtual file system. */
export const BRANDING_ASSET_PATHS = {
  logo: "/assets/logo",
  headerImage: "/assets/header-image",
  footerImage: "/assets/footer-image",
} as const;

export type BrandingAsset = keyof typeof BRANDING_ASSET_PATHS;

interface LayoutOptions {
  facility?: FacilityRead;
  templateSlug: string;
  hideFacilityHeader?: boolean;
}

interface AssetUrlOptions extends LayoutOptions {
  /** Shown when the template has no logo of its own. */
  defaultLogoUrl?: string;
}

/** The branding images a document needs, and where to fetch them from. */
export function getBrandingAssetUrls({
  facility,
  templateSlug,
  hideFacilityHeader,
  defaultLogoUrl,
}: AssetUrlOptions): Partial<Record<BrandingAsset, string>> {
  if (!facility) return {};

  const branding = resolvePrintTemplate(facility, templateSlug)?.branding;
  const urls: Partial<Record<BrandingAsset, string>> = {};

  if (branding?.footer_image?.url) {
    urls.footerImage = branding.footer_image.url;
  }
  if (hideFacilityHeader) return urls;

  if (branding?.header_image?.url) {
    urls.headerImage = branding.header_image.url;
  } else {
    const logoUrl = branding?.logo?.url || defaultLogoUrl;
    if (logoUrl) urls.logo = logoUrl;
  }
  return urls;
}

interface BuildLayoutOptions extends LayoutOptions {
  title: string;
  lang: string;
  statusWatermark?: StatusWatermark;
  /** Branding images that loaded. Missing ones are left out of the layout. */
  loadedAssets: ReadonlySet<BrandingAsset>;
  t: TFunction;
}

/** Translates the facility's print template into the layout `care.typ` uses. */
export function buildPrintLayout({
  facility,
  templateSlug,
  hideFacilityHeader,
  title,
  lang,
  statusWatermark,
  loadedAssets,
  t,
}: BuildLayoutOptions): PrintLayout {
  const template = facility
    ? resolvePrintTemplate(facility, templateSlug)
    : undefined;
  const page = template?.page;
  const branding = template?.branding;
  const watermark = template?.watermark;
  const customLogo = branding?.logo?.url ? branding.logo : undefined;

  return {
    title,
    lang: /^[a-z]{2,3}$/.test(lang) ? lang : "en",
    page: {
      paper: PAPERS[page?.size ?? "A4"] ?? "a4",
      flipped: page?.orientation === "landscape",
      margin: {
        top: page?.margin?.top ?? DEFAULT_MARGIN_MM,
        right: page?.margin?.right ?? DEFAULT_MARGIN_MM,
        bottom: page?.margin?.bottom ?? DEFAULT_MARGIN_MM,
        left: page?.margin?.left ?? DEFAULT_MARGIN_MM,
      },
    },
    header: facility
      ? {
          hidden: !!hideFacilityHeader,
          image: loadedAssets.has("headerImage")
            ? {
                path: BRANDING_ASSET_PATHS.headerImage,
                max_height: branding?.header_image?.height || null,
              }
            : null,
          logo: loadedAssets.has("logo")
            ? {
                path: BRANDING_ASSET_PATHS.logo,
                // Sizes and alignment apply to a facility's own logo only.
                width: customLogo?.width || null,
                height: customLogo?.height || null,
                alignment: customLogo?.alignment ?? "right",
              }
            : null,
          facility: {
            name: facility.name,
            address: facility.address || null,
            phone: facility.phone_number || null,
          },
        }
      : null,
    footer_image: loadedAssets.has("footerImage")
      ? {
          path: BRANDING_ASSET_PATHS.footerImage,
          max_height: branding?.footer_image?.height || null,
        }
      : null,
    watermark:
      watermark?.enabled && watermark.text
        ? {
            text: watermark.text,
            opacity: Math.min(Math.max(watermark.opacity ?? 0.08, 0), 1),
            rotation: watermark.rotation ?? -30,
          }
        : null,
    status_watermark: statusWatermark
      ? { text: statusWatermark.text, color: statusWatermark.color ?? "red" }
      : null,
    labels: {
      page_x_of_y: t("page_x_of_y", {
        current: "{current}",
        total: "{total}",
      }),
    },
  };
}

/** Whether the template asks to open the print dialog as soon as it's ready. */
export function isAutoPrintEnabled(
  facility: FacilityRead | undefined,
  templateSlug: string,
) {
  if (!facility) return false;
  return (
    resolvePrintTemplate(facility, templateSlug)?.print_setup?.auto_print ??
    false
  );
}
