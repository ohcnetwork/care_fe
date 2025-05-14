import dayjs from "dayjs";
import React from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DateFormats,
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
    <div className="w-full overflow-auto sticky top-0">
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
  const convertedSizePercent = rowSizeRatio.map((size) => size);

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
    <div className="flex flex-row w-full min-w-0">
      {Object.entries(elementsByAlignment).map(([key, item]) => (
        <div key={key} className="flex min-w-0" style={{ flexGrow: item.size }}>
          {item.elements.map((element, index) => (
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
  element: HeaderRow["columns"][number];
}) {
  switch (element.type) {
    case "text":
      return (
        <span
          className={cn(
            "flex w-full items-center px-1",
            element.align === "left" && "justify-start",
            element.align === "right" && "justify-end",
            element.align === "center" && "justify-center",
          )}
          style={{
            fontSize: element.size,
            fontWeight: element.weight,
          }}
        >
          <span className="truncate">{element.text}</span>
        </span>
      );

    case "image":
      return (
        <span
          className={cn(
            "flex w-full items-center px-1",
            element.align === "left" && "justify-start",
            element.align === "right" && "justify-end",
            element.align === "center" && "justify-center",
          )}
        >
          <img
            src={element.url}
            alt={element.file_name}
            className="object-cover h-auto"
            style={{
              width: element.width + "%",
            }}
          />
        </span>
      );

    case "rule":
      return (
        <span
          className={cn(
            "flex w-full items-center px-1",
            element.align === "left" && "justify-start",
            element.align === "right" && "justify-end",
            element.align === "center" && "justify-center",
          )}
        >
          <div
            className="border-t"
            style={{
              borderColor: element.stroke,
              width: element.length + "%",
            }}
          />
        </span>
      );

    case "datetime":
      return (
        <span
          className={cn(
            "flex w-full items-center px-1",
            element.align === "left" && "justify-start",
            element.align === "right" && "justify-end",
            element.align === "center" && "justify-center",
          )}
          style={{
            fontWeight: element.style.weight,
          }}
        >
          <span className="flex gap-1 truncate">
            <span>{element.label}</span>
            <span>
              {dayjs().format(
                Object.keys(DateFormats).find(
                  (key) =>
                    DateFormats[key as keyof typeof DateFormats] ===
                    element.format,
                ),
              )}
            </span>
          </span>
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
    <div className="flex flex-col gap-1 border-b border-gray-400 pb-4">
      {section.options.title && (
        <div className="text-lg font-bold">{t(section.options.title)}:</div>
      )}
      {isTable ? (
        <div className="border">
          <Table>
            <TableHeader className="bg-transparent hover:bg-transparent divide-x divide-gray-200 border-b-gray-200">
              <TableRow>
                {section.options.columns?.map((column) => (
                  <TableHead key={column} className="uppercase">
                    {t(column)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-blue-50 hover:bg-blue-50 divide-x divide-gray-200">
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
    </div>
  );
});
