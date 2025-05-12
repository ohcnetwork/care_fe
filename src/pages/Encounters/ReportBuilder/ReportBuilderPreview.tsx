import React from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

function getMarginValues({
  mode,
  custom,
  uniform,
}: {
  mode: string;
  custom?: { top?: string; right?: string; bottom?: string; left?: string };
  uniform?: string;
}): string[] | null {
  if (
    mode === "custom" &&
    custom?.top &&
    custom?.right &&
    custom?.bottom &&
    custom?.left
  ) {
    return [
      custom.top.replace("pt", ""),
      custom.right.replace("pt", ""),
      custom.bottom.replace("pt", ""),
      custom.left.replace("pt", ""),
    ];
  }
  if (mode === "uniform" && uniform) {
    const value = uniform.replace("pt", "");
    return [value, value, value, value];
  }
  return null;
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

  const pageMarginMode = useWatch({
    control: form.control,
    name: "config.layout.page_margin.mode",
  });

  const customMarginValues = useWatch({
    control: form.control,
    name: "config.layout.page_margin.values",
  });

  const uniformMarginValue = useWatch({
    control: form.control,
    name: "config.layout.page_margin.value",
  });

  const marginValues = getMarginValues({
    mode: pageMarginMode,
    custom: customMarginValues,
    uniform: uniformMarginValue,
  });

  const marginValuesEnabled = !!marginValues;

  const fontFamilyValue =
    FONT_OPTIONS.find((font) => font.value === fontFamily)?.value || "Arial";
  const fontSizeValue =
    FONT_SIZES.find((size) => size.id.toString() === fontSize)?.value || "12pt";

  return (
    <div className="w-full overflow-auto sticky top-0 h-screen">
      <div
        className="bg-white shadow-lg mx-auto h-full flex flex-col gap-2 border"
        style={{
          fontFamily: fontFamilyValue,
          fontSize: fontSizeValue,
          ...(marginValuesEnabled && {
            padding: marginValues
              .map((value) => Number(value) * 1.33 + "px")
              .join(" "),
          }),
        }}
      >
        {/* Header Preview */}
        <div className="flex flex-col gap-2 p-4">
          {headerRows.map((row, rowIndex) => (
            <HeaderRowPreview key={rowIndex} row={row} />
          ))}
        </div>

        {/* Sections Preview */}
        <div className="flex flex-col gap-4 p-4 flex-grow">
          {sections.map((section, index) => (
            <SectionPreview key={index} section={section} />
          ))}
        </div>

        {/* Page Numbering */}
        {pageNumbering.enabled && (
          <div className="w-full text-center mb-2">
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
            fontSize: element.size,
            fontWeight: element.weight,
            width: itemSize + "%",
            textAlign: element.align,
          }}
        >
          {element.text}
        </span>
      );
    case "image":
      return (
        <div
          style={{
            alignContent: element.align,
            width: itemSize + "%",
          }}
        >
          <img
            src={element.url}
            alt={element.file_name}
            className="w-full h-full object-cover"
          />
        </div>
      );
    case "rule":
      return <div className="border-t" style={{ width: itemSize + "%" }} />;
    case "datetime":
      return (
        <span
          className="whitespace-nowrap"
          style={{ width: itemSize + "%", textAlign: element.align }}
        >
          {element.format}
        </span>
      );
    default:
      return null;
  }
});

const SectionPreview = React.memo(function SectionPreview({
  section,
}: {
  section: SectionConfig;
}) {
  const isTable = section.is_table;
  const { t } = useTranslation();
  return (
    <>
      {isTable ? (
        <div className="rounded-lg border ">
          <Table>
            <TableHeader className="bg-transparent hover:bg-transparent divide-x divide-gray-200 border-b-gray-200">
              <TableRow>
                {section.options.columns?.map((column) => (
                  <TableHead key={column}>{t(column)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-transparent hover:bg-transparent divide-x divide-gray-200">
                {section.options.columns?.map((column) => (
                  <TableHead key={column}>{"-"}</TableHead>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {section.options.fields?.map((field, index) => {
            if (typeof field === "string") {
              return <div key={index}>{t(field)}</div>;
            } else {
              return (
                <div key={index}>
                  {field.label}: {field.value}
                </div>
              );
            }
          })}
        </div>
      )}
    </>
  );
});
