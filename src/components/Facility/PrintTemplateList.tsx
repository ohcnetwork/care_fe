import {
  CalendarDays,
  FileQuestion,
  LucideIcon,
  Package,
  Pencil,
  Printer,
  Receipt,
  SlidersHorizontal,
  Stethoscope,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { Muted } from "@/components/ui/typography";

import {
  PrintTemplateSheet,
  templateName,
} from "@/components/Facility/PrintTemplateSheet";

import type { FacilityRead } from "@/types/facility/facility";
import {
  PrintTemplateType,
  type PrintTemplate,
} from "@/types/facility/printTemplate";

type DocumentType = Exclude<PrintTemplateType, PrintTemplateType.default>;
type GroupKey =
  "billing" | "appointments" | "clinical" | "pharmacy_and_inventory";

const GROUP_ICONS: Record<GroupKey, LucideIcon> = {
  billing: Receipt,
  appointments: CalendarDays,
  clinical: Stethoscope,
  pharmacy_and_inventory: Package,
};

/** Where each document is printed from; every print type must be listed. */
const DOCUMENT_GROUPS: Record<DocumentType, GroupKey> = {
  [PrintTemplateType.invoice]: "billing",
  [PrintTemplateType.invoices]: "billing",
  [PrintTemplateType.charge_items]: "billing",
  [PrintTemplateType.payment_receipt]: "billing",
  [PrintTemplateType.appointment]: "appointments",
  [PrintTemplateType.appointments]: "appointments",
  [PrintTemplateType.prescription]: "clinical",
  [PrintTemplateType.medication_administration]: "clinical",
  [PrintTemplateType.diagnostic_report]: "clinical",
  [PrintTemplateType.questionnaire_response_logs]: "clinical",
  [PrintTemplateType.resource_letter]: "clinical",
  [PrintTemplateType.dispense_order]: "pharmacy_and_inventory",
  [PrintTemplateType.medication_return]: "pharmacy_and_inventory",
  [PrintTemplateType.request_order]: "pharmacy_and_inventory",
  [PrintTemplateType.delivery_order]: "pharmacy_and_inventory",
};

const DOCUMENT_TYPES = Object.keys(DOCUMENT_GROUPS) as DocumentType[];
const KNOWN_TYPES: string[] = Object.values(PrintTemplateType);

interface PrintTemplateListProps {
  facility: FacilityRead;
}

/**
 * Lists every print type with the template it prints with. Each type has at
 * most one template, so a type is chosen by opening its row, never by editing
 * an identifier.
 */
export function PrintTemplateList({ facility }: PrintTemplateListProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<string | null>(null);
  const templates = facility.print_templates ?? [];
  // Printing uses the first template of a type; later duplicates are ignored.
  const findTemplate = (slug: string) =>
    templates.find((template) => template.slug === slug);
  const defaultTemplate = findTemplate(PrintTemplateType.default);
  const unrecognized = [
    ...new Set(
      templates
        .map((template) => template.slug)
        .filter((slug) => slug.trim() && !KNOWN_TYPES.includes(slug)),
    ),
  ];

  const summarize = (template: PrintTemplate) =>
    [
      template.page?.size && t(`page_size_${template.page.size.toLowerCase()}`),
      template.page?.orientation && t(template.page.orientation),
      template.page?.margin && t("print_custom_margins"),
      template.branding?.logo?.url && t("logo"),
      template.branding?.header_image?.url && t("header_image"),
      template.branding?.footer_image?.url && t("footer_image"),
      template.watermark?.enabled && template.watermark.text && t("watermark"),
      template.print_setup?.auto_print && t("auto_print"),
    ]
      .filter(Boolean)
      .join(" · ") || t("print_template_standard_settings");

  const renderRow = (slug: string, fallback: string) => {
    const template = findTemplate(slug);
    const name = templateName(slug, t);
    return (
      <Item
        key={slug}
        role="listitem"
        aria-label={name}
        className="rounded-none border-0 border-border not-last:border-b"
      >
        <ItemContent className="min-w-0">
          <ItemTitle className="line-clamp-none flex-wrap">
            <span
              className={
                KNOWN_TYPES.includes(slug)
                  ? "wrap-break-word"
                  : "font-mono text-xs wrap-break-word"
              }
            >
              {name}
            </span>
            {template && slug !== PrintTemplateType.default && (
              <Badge variant="primary" size="sm">
                {t("custom")}
              </Badge>
            )}
          </ItemTitle>
          <ItemDescription>
            {template ? summarize(template) : fallback}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={t(
              template ? "print_template_edit" : "print_template_customize",
              { name },
            )}
            onClick={() => setEditing(slug)}
          >
            {template ? <Pencil /> : <SlidersHorizontal />}
            <span className="max-sm:sr-only">
              {t(template ? "edit" : "customize")}
            </span>
          </Button>
        </ItemActions>
      </Item>
    );
  };

  return (
    <div className="space-y-8">
      <TemplateSection
        id="print-templates-default"
        icon={Printer}
        title={t("default_template")}
        description={t("print_template_default_description")}
      >
        {renderRow(
          PrintTemplateType.default,
          t("print_template_default_unset"),
        )}
      </TemplateSection>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg leading-7 font-semibold">
            {t("document_templates")}
          </h2>
          <Muted className="mt-1">{t("document_templates_description")}</Muted>
        </div>
        {(Object.keys(GROUP_ICONS) as GroupKey[]).map((group) => (
          <TemplateSection
            key={group}
            id={`print-templates-${group}`}
            icon={GROUP_ICONS[group]}
            title={t(group)}
            headingLevel={3}
          >
            {DOCUMENT_TYPES.filter(
              (type) => DOCUMENT_GROUPS[type] === group,
            ).map((type) =>
              renderRow(
                type,
                t(
                  defaultTemplate
                    ? "print_template_uses_default"
                    : "print_template_uses_standard",
                ),
              ),
            )}
          </TemplateSection>
        ))}
      </div>

      {unrecognized.length > 0 && (
        <TemplateSection
          id="print-templates-unrecognized"
          icon={FileQuestion}
          title={t("unrecognized_print_templates")}
          description={t("unrecognized_print_templates_description")}
        >
          {unrecognized.map((slug) => renderRow(slug, ""))}
        </TemplateSection>
      )}

      <PrintTemplateSheet
        facility={facility}
        slug={editing}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}

function TemplateSection({
  id,
  icon: Icon,
  title,
  description,
  headingLevel = 2,
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  headingLevel?: 2 | 3;
  children: React.ReactNode;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <section aria-labelledby={id}>
      <Frame stacked>
        <FrameHeader className="flex-row items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground shadow-xs">
            <Icon className="size-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <FrameTitle>
              <Heading id={id} className="text-base leading-6 font-semibold">
                {title}
              </Heading>
            </FrameTitle>
            {description && <FrameDescription>{description}</FrameDescription>}
          </div>
        </FrameHeader>
        <FramePanel className="overflow-hidden p-0">
          <ItemGroup role="list" className="gap-0">
            {children}
          </ItemGroup>
        </FramePanel>
      </Frame>
    </section>
  );
}
