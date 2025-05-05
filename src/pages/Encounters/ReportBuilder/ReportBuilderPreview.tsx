import { ImageIcon } from "lucide-react";
import React from "react";
import { UseFormReturn, useWatch } from "react-hook-form";

import {
  FONT_OPTIONS,
  FONT_SIZES,
} from "@/types/reportTemplate/reportTemplate";

import { ReportTemplateFormData } from "./schema";

interface ReportBuilderPreviewProps {
  form: UseFormReturn<ReportTemplateFormData>;
}

interface HeaderElement {
  type: "text" | "image" | "rule" | "datetime";
  align?: "left" | "center" | "right";
  text?: string;
  size?: string;
  weight?: number;
  file_name?: string;
  width?: string;
  length?: string;
  format?: string;
}

interface Section {
  data_source: string;
  options: {
    text?: string;
    rows?: string[][];
    style?: "text" | "list";
    title?: string;
    fields?: string[] | { value: string; label: string }[];
    columns?: string[];
    filters?: Record<string, any>;
  };
  enabled: boolean;
  source: string;
  is_table?: boolean;
}

export const ReportBuilderPreview = React.memo(function ReportBuilderPreview({
  form,
}: ReportBuilderPreviewProps) {
  // Get layout settings
  const fontFamily = useWatch({
    control: form.control,
    name: "config.layout.text.font",
  });
  const fontSize = useWatch({
    control: form.control,
    name: "config.layout.text.size",
  });

  // Get header rows
  const headerRows = useWatch({
    control: form.control,
    name: "config.header.rows",
  }) as HeaderElement[][];

  // Get sections
  const sections = useWatch({
    control: form.control,
    name: "config.sections",
  }) as Section[];

  // Get page numbering settings
  const pageNumbering = useWatch({
    control: form.control,
    name: "config.layout.page_numbering",
  });

  const fontFamilyValue =
    FONT_OPTIONS.find((font) => font.value === fontFamily)?.value || "Arial";
  const fontSizeValue =
    FONT_SIZES.find((size) => size.id.toString() === fontSize)?.value || "12pt";

  return (
    <div className="w-full h-full p-4 overflow-auto">
      <div
        className="relative bg-white shadow-lg mx-auto"
        style={{
          width: "80%",
          aspectRatio: "1/1.414", // A4 ratio
          transform: "scale(0.7)",
          transformOrigin: "top",
          fontFamily: fontFamilyValue,
          fontSize: fontSizeValue,
        }}
      >
        {/* Header Preview */}
        <div className="p-4">
          {headerRows.map((row, rowIndex) => (
            <HeaderRowPreview key={rowIndex} row={row} />
          ))}
        </div>

        {/* Sections Preview */}
        <div className="p-4">
          {sections.map((section, index) => (
            <div key={index} className="border rounded-lg p-4 mb-4">
              <h3 className="font-semibold">{section.data_source}</h3>
            </div>
          ))}
        </div>

        {/* Page Numbering */}
        {pageNumbering.enabled && (
          <div className="absolute bottom-0 w-full text-center">
            {pageNumbering.format.replace("{page}", "1")}
          </div>
        )}
      </div>
    </div>
  );
});

const HeaderRowPreview = React.memo(function HeaderRowPreview({
  row,
}: {
  row: HeaderElement[];
}) {
  // Group elements by alignment
  const elementsByAlignment = row.reduce(
    (acc, element) => {
      const align = element.align || "left";
      if (!acc[align]) acc[align] = [];
      acc[align].push(element);
      return acc;
    },
    {} as Record<string, HeaderElement[]>,
  );

  return (
    <div className="flex flex-col gap-2">
      {Object.entries(elementsByAlignment).map(([align, elements]) => (
        <div
          key={align}
          className={`flex ${align === "center" ? "justify-center" : align === "right" ? "justify-end" : ""}`}
        >
          {elements.map((element, index) => (
            <HeaderElementPreview key={index} element={element} />
          ))}
        </div>
      ))}
    </div>
  );
});

const HeaderElementPreview = React.memo(function HeaderElementPreview({
  element,
}: {
  element: HeaderElement;
}) {
  switch (element.type) {
    case "text":
      return (
        <span
          className="whitespace-nowrap"
          style={{
            fontSize: element.size + "pt",
            fontWeight: element.weight,
          }}
        >
          {element.text}
        </span>
      );
    case "image":
      return (
        <div
          className="flex items-center gap-2 border rounded p-1"
          style={{ width: element.width }}
        >
          <ImageIcon className="w-4 h-4" />
          <span className="text-xs truncate">{element.file_name}</span>
        </div>
      );
    case "rule":
      return <div className="border-t" style={{ width: element.length }} />;
    case "datetime":
      return <span className="whitespace-nowrap">{element.format}</span>;
    default:
      return null;
  }
});
