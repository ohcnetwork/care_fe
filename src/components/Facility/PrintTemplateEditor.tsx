import { useId } from "react";
import { useTranslation } from "react-i18next";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { DEFAULT_MARGIN_MM, DEFAULT_WATERMARK } from "@/print/printLayout";
import type {
  BrandingConfig,
  PageConfig,
  PageMargin,
  PrintTemplate,
} from "@/types/facility/printTemplate";

type TemplateUpdater = (template: PrintTemplate) => PrintTemplate;

const UNSET = "__unset__";
const URL_PLACEHOLDER = "https://...";
const MARGIN_SIDES = ["top", "right", "bottom", "left"] as const;
const BRANDING_IMAGES = ["logo", "header_image", "footer_image"] as const;

const toNumber = (value: string) => (value === "" ? undefined : Number(value));

/** Drops empty settings, and fills blank margins once any side is set. */
export function cleanPrintTemplate(template: PrintTemplate): PrintTemplate {
  const { page, print_setup, branding, watermark } = template;
  const margin = page?.margin && compact(page.margin);
  const withUrl = <T extends { url?: string }>(image?: T) =>
    image?.url?.trim() ? image : undefined;
  return {
    ...template,
    page:
      page &&
      compact({
        ...page,
        margin: margin && {
          top: DEFAULT_MARGIN_MM,
          right: DEFAULT_MARGIN_MM,
          bottom: DEFAULT_MARGIN_MM,
          left: DEFAULT_MARGIN_MM,
          ...(margin as Partial<PageMargin>),
        },
      }),
    print_setup: print_setup?.auto_print ? print_setup : undefined,
    branding:
      branding &&
      compact({
        ...branding,
        logo: withUrl(branding.logo),
        header_image: withUrl(branding.header_image),
        footer_image: withUrl(branding.footer_image),
      }),
    watermark: watermark && compact(watermark),
  };
}

function compact<T extends object>(value: T): T | undefined {
  const entries = Object.entries(value).filter(([, v]) => v !== undefined);
  return entries.length ? (Object.fromEntries(entries) as T) : undefined;
}

/** Settings the facility API would reject. */
export function getPrintTemplateErrors(template: PrintTemplate) {
  const margins = Object.values(template.page?.margin ?? {});
  const opacity = template.watermark?.opacity;
  return {
    margin: margins.some((value) => value < 0),
    opacity: opacity !== undefined && (opacity < 0 || opacity > 1),
  };
}

interface PrintTemplateEditorProps {
  template: PrintTemplate;
  onChange: (updater: TemplateUpdater) => void;
}

/** Page, branding, watermark and print settings of one print template. */
export function PrintTemplateEditor({
  template,
  onChange,
}: PrintTemplateEditorProps) {
  return (
    <div className="flex flex-col gap-4">
      <PageSection template={template} onChange={onChange} />
      <BrandingSection template={template} onChange={onChange} />
      <WatermarkSection template={template} onChange={onChange} />
      <PrintSetupSection template={template} onChange={onChange} />
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId}>
      <Frame>
        <FrameHeader>
          <FrameTitle>
            <h3 id={headingId} className="text-base leading-6 font-semibold">
              {title}
            </h3>
          </FrameTitle>
          <FrameDescription>{description}</FrameDescription>
        </FrameHeader>
        <FramePanel>
          <FieldGroup className="gap-5">{children}</FieldGroup>
        </FramePanel>
      </Frame>
    </section>
  );
}

function PageSection({ template, onChange }: PrintTemplateEditorProps) {
  const { t } = useTranslation();
  const id = useId();
  const page = template.page;
  const errors = getPrintTemplateErrors(template);
  const setPage = (update: Partial<PageConfig>) =>
    onChange((tpl) => ({ ...tpl, page: { ...tpl.page, ...update } }));

  return (
    <Section
      title={t("page_settings")}
      description={t("print_page_settings_description")}
    >
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor={`${id}-size`}>{t("page_size")}</FieldLabel>
          <Select
            value={page?.size ?? UNSET}
            onValueChange={(value) =>
              setPage({
                size:
                  value === UNSET ? undefined : (value as PageConfig["size"]),
              })
            }
          >
            <SelectTrigger id={`${id}-size`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNSET}>
                {t("print_page_size_unset")}
              </SelectItem>
              <SelectItem value="A4">{t("page_size_a4")}</SelectItem>
              <SelectItem value="A5">{t("page_size_a5")}</SelectItem>
              <SelectItem value="Letter">{t("page_size_letter")}</SelectItem>
              <SelectItem value="Legal">{t("page_size_legal")}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-orientation`}>
            {t("page_orientation")}
          </FieldLabel>
          <Select
            value={page?.orientation ?? UNSET}
            onValueChange={(value) =>
              setPage({
                orientation:
                  value === UNSET
                    ? undefined
                    : (value as PageConfig["orientation"]),
              })
            }
          >
            <SelectTrigger id={`${id}-orientation`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNSET}>
                {t("print_page_orientation_unset")}
              </SelectItem>
              <SelectItem value="portrait">{t("portrait")}</SelectItem>
              <SelectItem value="landscape">{t("landscape")}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <FieldSet className="gap-3">
        <FieldLegend variant="label" className="mb-0">
          {t("page_margins_mm")}
        </FieldLegend>
        <FieldDescription>
          {t("print_page_margins_description", { mm: DEFAULT_MARGIN_MM })}
        </FieldDescription>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MARGIN_SIDES.map((side) => (
            <Field key={side}>
              <FieldLabel htmlFor={`${id}-margin-${side}`}>
                {t(side)}
              </FieldLabel>
              <Input
                id={`${id}-margin-${side}`}
                type="number"
                inputMode="decimal"
                min={0}
                step={0.5}
                placeholder={String(DEFAULT_MARGIN_MM)}
                aria-invalid={(page?.margin?.[side] ?? 0) < 0 || undefined}
                value={page?.margin?.[side] ?? ""}
                onChange={(event) => {
                  const value = toNumber(event.target.value);
                  onChange((tpl) => ({
                    ...tpl,
                    page: {
                      ...tpl.page,
                      // Blank sides are filled in on save.
                      margin: {
                        ...tpl.page?.margin,
                        [side]: value,
                      } as PageMargin,
                    },
                  }));
                }}
              />
            </Field>
          ))}
        </div>
        {errors.margin && (
          <FieldError>{t("print_page_margins_negative")}</FieldError>
        )}
      </FieldSet>
    </Section>
  );
}

function BrandingSection({ template, onChange }: PrintTemplateEditorProps) {
  const { t } = useTranslation();
  const id = useId();
  const branding = template.branding;
  const setImage = <K extends (typeof BRANDING_IMAGES)[number]>(
    key: K,
    update: Partial<NonNullable<BrandingConfig[K]>>,
  ) =>
    onChange((tpl) => ({
      ...tpl,
      branding: {
        ...tpl.branding,
        [key]: {
          ...(key === "logo" && { alignment: "left" }),
          url: "",
          ...tpl.branding?.[key],
          ...update,
        },
      },
    }));

  return (
    <Section
      title={t("branding")}
      description={t("print_branding_description")}
    >
      {BRANDING_IMAGES.map((key) => {
        const image = branding?.[key];
        return (
          <FieldSet key={key} className="gap-3">
            <FieldLegend variant="label" className="mb-0">
              {t(key)}
            </FieldLegend>
            <FieldDescription>{t(`print_${key}_description`)}</FieldDescription>
            <Field>
              <FieldLabel htmlFor={`${id}-${key}-url`}>
                {t("image_url")}
              </FieldLabel>
              <Input
                id={`${id}-${key}-url`}
                type="url"
                placeholder={URL_PLACEHOLDER}
                value={image?.url ?? ""}
                onChange={(event) => setImage(key, { url: event.target.value })}
              />
            </Field>
            {/* Sizes only matter once there is an image to size. */}
            {image?.url?.trim() && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {key === "logo" && (
                  <Field>
                    <FieldLabel htmlFor={`${id}-${key}-width`}>
                      {t("width_in_px")}
                    </FieldLabel>
                    <Input
                      id={`${id}-${key}-width`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={branding?.logo?.width ?? ""}
                      onChange={(event) =>
                        setImage("logo", {
                          width: toNumber(event.target.value),
                        })
                      }
                    />
                  </Field>
                )}
                <Field>
                  <FieldLabel htmlFor={`${id}-${key}-height`}>
                    {t("height_in_px")}
                  </FieldLabel>
                  <Input
                    id={`${id}-${key}-height`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={image.height ?? ""}
                    onChange={(event) =>
                      setImage(key, { height: toNumber(event.target.value) })
                    }
                  />
                </Field>
                {key === "logo" && (
                  <Field>
                    <FieldLabel htmlFor={`${id}-${key}-alignment`}>
                      {t("alignment")}
                    </FieldLabel>
                    <Select
                      value={branding?.logo?.alignment ?? "left"}
                      onValueChange={(value) =>
                        setImage("logo", {
                          alignment: value as "left" | "center" | "right",
                        })
                      }
                    >
                      <SelectTrigger
                        id={`${id}-${key}-alignment`}
                        className="w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">{t("left")}</SelectItem>
                        <SelectItem value="center">{t("center")}</SelectItem>
                        <SelectItem value="right">{t("right")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </div>
            )}
          </FieldSet>
        );
      })}
    </Section>
  );
}

function WatermarkSection({ template, onChange }: PrintTemplateEditorProps) {
  const { t } = useTranslation();
  const id = useId();
  const watermark = template.watermark;
  const errors = getPrintTemplateErrors(template);
  const setWatermark = (update: NonNullable<PrintTemplate["watermark"]>) =>
    onChange((tpl) => ({
      ...tpl,
      watermark: { ...tpl.watermark, ...update },
    }));

  return (
    <Section
      title={t("watermark")}
      description={t("print_watermark_description")}
    >
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel htmlFor={`${id}-enabled`}>
            {t("enable_watermark")}
          </FieldLabel>
          <FieldDescription>
            {t("enable_watermark_description")}
          </FieldDescription>
        </FieldContent>
        <Switch
          id={`${id}-enabled`}
          checked={watermark?.enabled ?? false}
          onCheckedChange={(enabled) => setWatermark({ enabled })}
        />
      </Field>
      {watermark?.enabled && (
        <>
          <Field>
            <FieldLabel htmlFor={`${id}-text`}>
              {t("watermark_text")}
            </FieldLabel>
            <Input
              id={`${id}-text`}
              value={watermark.text ?? ""}
              placeholder={t("watermark_text_placeholder")}
              onChange={(event) => setWatermark({ text: event.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor={`${id}-opacity`}>
                {t("print_watermark_opacity")}
              </FieldLabel>
              <Input
                id={`${id}-opacity`}
                type="number"
                inputMode="decimal"
                min={0}
                max={1}
                step={0.05}
                placeholder={String(DEFAULT_WATERMARK.opacity)}
                aria-invalid={errors.opacity || undefined}
                value={watermark.opacity ?? ""}
                onChange={(event) =>
                  setWatermark({ opacity: toNumber(event.target.value) })
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-rotation`}>
                {t("rotation_in_degrees")}
              </FieldLabel>
              <Input
                id={`${id}-rotation`}
                type="number"
                inputMode="numeric"
                step={1}
                placeholder={String(DEFAULT_WATERMARK.rotation)}
                value={watermark.rotation ?? ""}
                onChange={(event) =>
                  setWatermark({ rotation: toNumber(event.target.value) })
                }
              />
            </Field>
          </div>
          {errors.opacity && (
            <FieldError>{t("print_watermark_opacity_invalid")}</FieldError>
          )}
        </>
      )}
    </Section>
  );
}

function PrintSetupSection({ template, onChange }: PrintTemplateEditorProps) {
  const { t } = useTranslation();
  const id = useId();

  return (
    <Section
      title={t("print_setup")}
      description={t("print_setup_description")}
    >
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel htmlFor={`${id}-auto-print`}>
            {t("auto_print")}
          </FieldLabel>
          <FieldDescription>{t("auto_print_description")}</FieldDescription>
        </FieldContent>
        <Switch
          id={`${id}-auto-print`}
          checked={template.print_setup?.auto_print ?? false}
          onCheckedChange={(auto_print) =>
            onChange((tpl) => ({
              ...tpl,
              print_setup: { ...tpl.print_setup, auto_print },
            }))
          }
        />
      </Field>
    </Section>
  );
}
