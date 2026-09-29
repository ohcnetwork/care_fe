import type { PageConfig, PrintTemplate } from "@/types/facility/printTemplate";

/**
 * Document templates override only the fields they configure. An explicit false,
 * zero, or empty image URL must not be replaced by the facility default.
 */
export function resolvePrintTemplate(
  templates: PrintTemplate[] | undefined,
  slug: string,
): PrintTemplate | undefined {
  const defaults = templates?.find((template) => template.slug === "default");
  const override = templates?.find((template) => template.slug === slug);
  if (!override) return defaults;
  if (!defaults || override === defaults) return override;

  return {
    ...defaults,
    ...override,
    page: {
      ...defaults.page,
      ...override.page,
      margin: override.page?.margin ?? defaults.page?.margin,
    },
    print_setup: { ...defaults.print_setup, ...override.print_setup },
    branding: {
      ...defaults.branding,
      ...override.branding,
      logo: override.branding?.logo
        ? { ...defaults.branding?.logo, ...override.branding.logo }
        : defaults.branding?.logo,
      header_image: override.branding?.header_image
        ? {
            ...defaults.branding?.header_image,
            ...override.branding.header_image,
          }
        : defaults.branding?.header_image,
      footer_image: override.branding?.footer_image
        ? {
            ...defaults.branding?.footer_image,
            ...override.branding.footer_image,
          }
        : defaults.branding?.footer_image,
    },
    watermark: { ...defaults.watermark, ...override.watermark },
  };
}

const PAPER_SIZES = {
  A4: [210, 297],
  A5: [148, 210],
  Letter: [215.9, 279.4],
  Legal: [215.9, 355.6],
} as const;

export function getPrintPage(
  template?: PrintTemplate,
  defaultPage?: PageConfig,
) {
  const page = { ...defaultPage, ...template?.page };
  const size =
    page?.size && Object.hasOwn(PAPER_SIZES, page.size) ? page.size : "A4";
  const orientation =
    page?.orientation === "landscape" ? "landscape" : "portrait";
  const [short, long] = PAPER_SIZES[size];
  const [width, height] =
    orientation === "landscape" ? [long, short] : [short, long];
  const marginValue = (value?: number) =>
    typeof value === "number" && Number.isFinite(value) && value >= 0
      ? value
      : 10;
  const margin = {
    top: marginValue(page?.margin?.top),
    right: marginValue(page?.margin?.right),
    bottom: marginValue(page?.margin?.bottom),
    left: marginValue(page?.margin?.left),
  };
  if (margin.left + margin.right >= width) {
    margin.left = margin.right = 10;
  }
  if (margin.top + margin.bottom >= height) {
    margin.top = margin.bottom = 10;
  }

  return {
    width,
    height,
    margin,
    contentWidth: width - margin.left - margin.right,
    contentHeight: height - margin.top - margin.bottom,
    style: `@media print { @page { size: ${size} ${orientation}; margin: ${margin.top}mm ${margin.right}mm ${margin.bottom}mm ${margin.left}mm; } }`,
  };
}
