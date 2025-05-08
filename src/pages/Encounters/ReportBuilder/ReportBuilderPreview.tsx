import { ImageIcon } from "lucide-react";
import React from "react";
import { UseFormReturn, useWatch } from "react-hook-form";

import {
  FONT_OPTIONS,
  FONT_SIZES,
  HeaderAlignment,
  HeaderRow,
  SectionConfig,
} from "@/types/reportTemplate/reportTemplate";

import { ReportTemplateFormData } from "./schema";

interface ReportBuilderPreviewProps {
  form: UseFormReturn<ReportTemplateFormData>;
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
  }) as HeaderRow[];

  // Get sections
  const sections = useWatch({
    control: form.control,
    name: "config.sections",
  }) as SectionConfig[];

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
        <div className="flex flex-col gap-2 p-4">
          {headerRows.map((row, rowIndex) => (
            <HeaderRowPreview key={rowIndex} row={row} />
          ))}
        </div>

        {/* Sections Preview */}
        <div className="p-4">
          {sections.map((section, index) => (
            <div key={index} className="border rounded-lg p-4 mb-4">
              <h3 className="font-semibold">{section.source}</h3>
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
  row: HeaderRow;
}) {
  const rowSizeRatio = row.size_ratio || [1];
  const totalSizeRatio = rowSizeRatio.reduce((acc, size) => acc + size, 0);
  const convertedSizePercent = rowSizeRatio.map(
    (size) => (size / totalSizeRatio) * 100,
  );

  // Group elements by alignment
  const elementsByAlignment = row.columns.reduce(
    (acc, element, index) => {
      acc[index] = {
        align: element.align || "left",
        size: convertedSizePercent[index],
        elements: [...(acc[index]?.elements || []), element],
      };
      return acc;
    },
    {} as Record<
      string,
      {
        align: HeaderAlignment;
        size: number;
        elements: HeaderRow["columns"];
      }
    >,
  );

  return (
    <div className="flex flex-row gap-2 justify-between">
      {Object.entries(elementsByAlignment).map(([_, item]) => (
        <>
          {item.elements.map((element, index) => (
            <HeaderElementPreview
              key={index}
              element={element}
              itemSize={item.size}
            />
          ))}
        </>
      ))}
    </div>
  );
});

const HeaderElementPreview = React.memo(function HeaderElementPreview({
  element,
  itemSize,
}: {
  element: HeaderRow["columns"][number];
  itemSize: number;
}) {
  switch (element.type) {
    case "text":
      return (
        <span
          className="whitespace-nowrap"
          style={{
            fontSize: element.size + "pt",
            fontWeight: element.weight,
            width: itemSize + "%",
          }}
        >
          {element.text}
        </span>
      );
    case "image":
      return (
        <div
          className="flex items-center gap-2 border rounded p-1"
          style={{ width: itemSize + "%" }}
        >
          <ImageIcon className="w-4 h-4" />
          <span className="text-xs truncate">{element.file_name}</span>
        </div>
      );
    case "rule":
      return <div className="border-t" style={{ width: itemSize + "%" }} />;
    case "datetime":
      return (
        <span className="whitespace-nowrap" style={{ width: itemSize + "%" }}>
          {element.format}
        </span>
      );
    default:
      return null;
  }
});
