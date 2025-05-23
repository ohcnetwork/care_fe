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
  AlignmentOptions,
  DateFormats,
  FONT_OPTIONS,
  FONT_SIZES,
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
    return [custom.top, custom.right, custom.bottom, custom.left];
  }
  if (mode === "uniform" && uniform) {
    return [uniform, uniform, uniform, uniform];
  }
  return null;
}

export type Position = {
  vertical: "top" | "bottom";
  horizontal: "left" | "right" | "center";
};

export function parseAlignment(align: AlignmentOptions): Position {
  const isTop = align.startsWith("top");
  const horizontal = align.includes("+")
    ? align.split("+")[1].toLowerCase()
    : align.toLowerCase();

  return {
    vertical: isTop ? "top" : "bottom",
    horizontal: horizontal as Position["horizontal"],
  };
}

export default function ReportBuilderPreview({
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
    defaultValue: [],
  }) as HeaderRow[];

  // Get sections
  const sections = useWatch({
    control: form.control,
    name: "config.sections",
    defaultValue: [],
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
  const fontSizeValue = Math.floor(
    (FONT_SIZES.find((size) => size.value === fontSize)?.id || 12) * 1.33,
  );

  const pageNumberingAlign = useWatch({
    control: form.control,
    name: "config.layout.page_numbering.align",
  });

  const { vertical, horizontal } = parseAlignment(pageNumberingAlign);
  const showPageNumberAtTop = vertical === "top";

  return (
    <div className="w-full overflow-auto sticky top-0">
      <div
        className={cn(
          "bg-white shadow-lg mx-auto h-full flex flex-col gap-2 border",
        )}
        style={{
          fontFamily: fontFamilyValue,
          fontSize: `${fontSizeValue}px`,
          ...(marginValuesEnabled && {
            padding: marginValues
              .map((value) => Math.floor(Number(value) * 1.33) + "px")
              .join(" "),
          }),
        }}
      >
        {/* Top Page Numbering */}
        {pageNumbering?.enabled && (
          <div
            className={cn(
              "w-full mb-2",
              `text-${horizontal}`,
              showPageNumberAtTop ? "order-first" : "order-last",
            )}
          >
            {pageNumbering.format.replace("{page}", "1")}
          </div>
        )}

        {/* Header Preview */}
        <div className="flex flex-col gap-2 p-4">
          {headerRows.length > 0 &&
            headerRows.map((row, rowIndex) => (
              <HeaderRowPreview key={rowIndex} row={row} />
            ))}
        </div>

        {/* Sections Preview */}
        <div className="flex flex-col gap-4 p-4 flex-grow">
          {sections.length > 0 &&
            sections.map(
              (section, index) =>
                section.enabled && (
                  <SectionPreview key={index} section={section} />
                ),
            )}
        </div>
      </div>
    </div>
  );
}

function HeaderRowPreview({ row }: { row: HeaderRow }) {
  const rowSizeRatio: number[] =
    row.size_ratio || Array(row.columns.length).fill(1);
  const totalSizeRatio = rowSizeRatio.reduce((acc, curr) => acc + curr, 0) || 1;

  return (
    <div className="flex flex-row w-full min-w-0">
      {row.columns.map((column, index) => (
        <div
          key={index}
          className="flex flex-wrap min-w-0 basis-0"
          style={{
            flexGrow: rowSizeRatio[index],
            width: `${(rowSizeRatio[index] / totalSizeRatio) * 100}%`,
          }}
        >
          <HeaderElementPreview element={column} />
        </div>
      ))}
    </div>
  );
}

function HeaderElementPreview({
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
          <span>{element.text}</span>
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
            color: element.style.fill,
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
}

function SectionPreview({ section }: { section: SectionConfig }) {
  const isTable = section.is_table;
  const isCustomSection = section.source === "custom_section";
  const isTextStyle = !isTable && section.options.style === "text";
  const { t } = useTranslation();

  const fields = section.options.fields;
  const text = section.options.text;
  const columns = section.options.columns;

  const customSectionFields = fields?.map((field) => {
    if (typeof field === "string") {
      return { label: field, value: field };
    }
    return field;
  });

  return (
    <div className="flex flex-col gap-1 border-b border-gray-400 pb-4">
      {section.options.title && (
        <div className="text-lg font-bold">{t(section.options.title)}:</div>
      )}
      {isTable ? (
        <div className="border w-full">
          <Table className="table-fixed overflow-clip">
            <TableHeader className="bg-transparent hover:bg-transparent divide-x divide-gray-200 border-b-gray-200">
              <TableRow>
                {isCustomSection
                  ? customSectionFields?.map((field) => (
                      <TableHead
                        key={field.label}
                        className="uppercase break-words whitespace-normal p-2"
                      >
                        {t(field.label)}
                      </TableHead>
                    ))
                  : columns?.map((column) => (
                      <TableHead
                        key={column}
                        className="uppercase break-words whitespace-normal p-2"
                      >
                        {t(column)}
                      </TableHead>
                    ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-blue-50 hover:bg-blue-50 divide-x divide-gray-200">
                {isCustomSection
                  ? customSectionFields?.map((field) => (
                      <TableHead key={field.value}>{t(field.value)}</TableHead>
                    ))
                  : columns?.map((column) => (
                      <TableHead key={column}>########</TableHead>
                    ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ) : isTextStyle ? (
        isCustomSection ? (
          <ul className="list-disc list-inside">
            {text?.map((item, index) => <li key={index}>{t(item)}</li>)}
          </ul>
        ) : (
          <ul className="list-disc list-inside">
            <li className="lowercase">
              {fields
                ?.map(
                  (field) =>
                    t(typeof field === "string" ? field : field.label) +
                    " " +
                    t("value"),
                )
                .join(", ")}
            </li>
          </ul>
        )
      ) : (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[max-content_1fr] gap-3">
            {fields?.map((field, index) => {
              if (typeof field === "string") {
                return (
                  <React.Fragment key={index}>
                    <span>{t(field)}:</span>
                    <span>########</span>
                  </React.Fragment>
                );
              } else {
                return (
                  <React.Fragment key={index}>
                    <span>{t(field.label)}:</span>
                    <span>{t(field.value)}</span>
                  </React.Fragment>
                );
              }
            })}
          </div>
        </div>
      )}
    </div>
  );
}
