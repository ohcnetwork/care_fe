import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { FacilityRead } from "@/types/facility/facility";

import { fetchPrintImage } from "@/print/printAssets";
import {
  BRANDING_ASSET_PATHS,
  type BrandingAsset,
  buildPrintLayout,
  getBrandingAssetUrls,
  isAutoPrintEnabled,
} from "@/print/printLayout";
import { resolvePrintTheme } from "@/print/printTheme";
import type { PrintDocument, StatusWatermark } from "@/print/types";
import { compileTypstPdf } from "@/print/typstClient";

export interface TypstPdfOptions<TContent> {
  /** Name of a file in `src/print/templates`, without `.typ`. */
  template: string;
  /** Leave undefined until the data is ready. */
  content: TContent | undefined;
  /** The PDF's title and file name. */
  title: string;
  facility?: FacilityRead;
  templateSlug: string;
  hideFacilityHeader?: boolean;
  /** For wide documents: landscape whatever the facility's template says. */
  landscape?: boolean;
  /** Margin in mm when the template sets none (10 if omitted). */
  defaultMargin?: number;
  statusWatermark?: StatusWatermark;
  /** Extra files by virtual path, e.g. a QR code SVG. Keep them small. */
  files?: Record<string, Uint8Array>;
}

function fingerprint(bytes: Uint8Array) {
  let hash = 0x811c9dc5;
  for (const byte of bytes) hash = Math.imul(hash ^ byte, 0x01000193);
  return (hash >>> 0).toString(36);
}

/** Failures are reported, not thrown. */
async function fetchBrandingAssets(
  urls: Partial<Record<BrandingAsset, string>>,
) {
  const entries = Object.entries(urls) as [BrandingAsset, string][];
  const results = await Promise.allSettled(
    entries.map(([, url]) => fetchPrintImage(url)),
  );

  const files: Record<string, Uint8Array> = {};
  const loaded = new Set<BrandingAsset>();
  const failed: BrandingAsset[] = [];
  results.forEach((result, i) => {
    const asset = entries[i][0];
    if (result.status === "fulfilled") {
      files[BRANDING_ASSET_PATHS[asset]] = result.value;
      loaded.add(asset);
    } else {
      console.warn(`Print: couldn't load the ${asset}`, result.reason);
      failed.push(asset);
    }
  });
  return { files, loaded, failed };
}

export function useTypstPdf<TContent>({
  template,
  content,
  title,
  facility,
  templateSlug,
  hideFacilityHeader,
  landscape,
  defaultMargin,
  statusWatermark,
  files,
}: TypstPdfOptions<TContent>) {
  const { t } = useTranslation();
  const watermarkText = statusWatermark?.text;
  const watermarkColor = statusWatermark?.color;

  const assetUrls = useMemo(
    () =>
      getBrandingAssetUrls({
        facility,
        templateSlug,
        hideFacilityHeader,
        defaultLogoUrl: careConfig.mainLogo?.dark,
      }),
    [facility, templateSlug, hideFacilityHeader],
  );

  const assets = useQuery({
    queryKey: ["print-branding-assets", assetUrls],
    queryFn: () => fetchBrandingAssets(assetUrls),
    staleTime: Infinity,
  });

  const layout = useMemo(
    () =>
      assets.data &&
      buildPrintLayout({
        facility,
        templateSlug,
        hideFacilityHeader,
        title,
        landscape,
        defaultMargin,
        statusWatermark: watermarkText
          ? { text: watermarkText, color: watermarkColor }
          : undefined,
        loadedAssets: assets.data.loaded,
        t,
      }),
    [
      assets.data,
      facility,
      templateSlug,
      hideFacilityHeader,
      title,
      landscape,
      defaultMargin,
      watermarkText,
      watermarkColor,
      t,
    ],
  );

  // The key is hashed on every render: a string is far cheaper than a deep object.
  const contentKey = useMemo(() => JSON.stringify(content), [content]);

  const pdf = useQuery({
    queryKey: [
      "typst-pdf",
      template,
      layout,
      contentKey,
      assetUrls,
      Object.entries(files ?? {}).map(([path, bytes]) => [
        path,
        fingerprint(bytes),
      ]),
    ],
    queryFn: () => {
      const document: PrintDocument<TContent> = {
        layout: layout!,
        content: content!,
      };
      return compileTypstPdf({
        template,
        data: document,
        theme: resolvePrintTheme(),
        files: { ...assets.data!.files, ...files },
      });
    },
    enabled: !!layout && content !== undefined,
    staleTime: Infinity,
    gcTime: 60_000,
    retry: false,
  });

  return {
    pdf: pdf.data,
    error: pdf.error,
    isLoading: assets.isLoading || pdf.isLoading || content === undefined,
    isFetching: pdf.isFetching,
    retry: pdf.refetch,
    /** Branding images that couldn't be loaded and were left out. */
    failedAssets: assets.data?.failed ?? [],
    autoPrint: isAutoPrintEnabled(facility, templateSlug),
  };
}
