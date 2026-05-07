import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Droplets,
  FileText,
  Image,
  Plus,
  Printer,
  RotateCcw,
  Settings,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

import mutate from "@/Utils/request/mutate";
import { FacilityRead } from "@/types/facility/facility";
import facilityApi from "@/types/facility/facilityApi";
import {
  PrintTemplateType,
  type PrintTemplate,
} from "@/types/facility/printTemplate";

interface Props {
  facility: FacilityRead;
  trigger?: React.ReactNode;
}

const EMPTY_TEMPLATE: PrintTemplate = {
  slug: "",
};

export default function PrintTemplateSheet({ facility, trigger }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setTemplates(
        facility.print_templates?.length
          ? structuredClone(facility.print_templates)
          : [],
      );
    }
    setOpen(isOpen);
  };

  const { mutate: updateFacility, isPending } = useMutation({
    mutationFn: mutate(facilityApi.update, {
      pathParams: { facilityId: facility.id },
    }),
    onSuccess: () => {
      toast.success(t("print_templates_updated"));
      queryClient.invalidateQueries({ queryKey: ["facility", facility.id] });
      setOpen(false);
    },
  });

  const handleSave = () => {
    const validTemplates = templates.filter((tpl) => tpl.slug.trim());
    updateFacility({
      name: facility.name,
      description: facility.description,
      address: facility.address,
      phone_number: facility.phone_number,
      facility_type: facility.facility_type,
      is_public: facility.is_public,
      latitude: facility.latitude,
      longitude: facility.longitude,
      middleware_address: facility.middleware_address,
      pincode: facility.pincode,
      geo_organization: facility.geo_organization.id,
      features: facility.features,
      print_templates: validTemplates,
    });
  };

  const addTemplate = () => {
    setTemplates((prev) => [...prev, { ...EMPTY_TEMPLATE }]);
  };

  const removeTemplate = (index: number) => {
    setTemplates((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTemplate = (
    index: number,
    updater: (tpl: PrintTemplate) => PrintTemplate,
  ) => {
    setTemplates((prev) =>
      prev.map((tpl, i) => (i === index ? updater(tpl) : tpl)),
    );
  };

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("print_templates")}</SheetTitle>
          <SheetDescription>
            {t("print_templates_description")}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {templates.length === 0 && (
            <div className="text-center py-8 text-gray-500 border border-dashed rounded-lg">
              <Printer className="mx-auto mb-2 size-8 text-gray-400" />
              <p className="text-sm">{t("no_print_templates")}</p>
              <p className="text-xs mt-1">{t("no_print_templates_hint")}</p>
            </div>
          )}

          {templates.map((template, index) => (
            <TemplateEditor
              key={index}
              template={template}
              onUpdate={(updater) => updateTemplate(index, updater)}
              onRemove={() => removeTemplate(index)}
            />
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={addTemplate}
          >
            <Plus className="mr-2 size-4" />
            {t("add_print_template")}
          </Button>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TemplateEditor({
  template,
  onUpdate,
  onRemove,
}: {
  template: PrintTemplate;
  onUpdate: (updater: (tpl: PrintTemplate) => PrintTemplate) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="border rounded-lg">
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex-1 mr-4">
          <Label className="text-xs text-gray-500">{t("template_slug")}</Label>
          <Select
            value={template.slug || undefined}
            onValueChange={(value) =>
              onUpdate((tpl) => ({ ...tpl, slug: value }))
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={t("template_slug_placeholder")} />
            </SelectTrigger>
            <SelectContent>
              {Object.values(PrintTemplateType).map((slug) => (
                <SelectItem key={slug} value={slug}>
                  {t(slug)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-4"
          onClick={onRemove}
          aria-label={t("remove")}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <Accordion type="multiple" className="px-4 pb-2">
        {/* Page Settings */}
        <AccordionItem value="page">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2">
              <FileText className="size-4" />
              {t("page_settings")}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <PageSection template={template} onUpdate={onUpdate} />
          </AccordionContent>
        </AccordionItem>

        {/* Print Setup */}
        <AccordionItem value="print_setup">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2">
              <Settings className="size-4" />
              {t("print_setup")}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <PrintSetupSection template={template} onUpdate={onUpdate} />
          </AccordionContent>
        </AccordionItem>

        {/* Branding */}
        <AccordionItem value="branding">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2">
              <Image className="size-4" />
              {t("branding")}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <BrandingSection template={template} onUpdate={onUpdate} />
          </AccordionContent>
        </AccordionItem>

        {/* Watermark */}
        <AccordionItem value="watermark">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2">
              <Droplets className="size-4" />
              {t("watermark")}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <WatermarkSection template={template} onUpdate={onUpdate} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

type SectionProps = {
  template: PrintTemplate;
  onUpdate: (updater: (tpl: PrintTemplate) => PrintTemplate) => void;
};

function PageSection({ template, onUpdate }: SectionProps) {
  const { t } = useTranslation();
  const page = template.page;

  const hasPageConfig = page?.size || page?.orientation || page?.margin;

  return (
    <div className="space-y-4">
      {hasPageConfig && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-gray-500 hover:text-red-600"
            onClick={() =>
              onUpdate((tpl) => {
                const { page: _, ...rest } = tpl;
                return rest as PrintTemplate;
              })
            }
          >
            <RotateCcw className="mr-1 size-3" />
            {t("clear")}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs text-gray-500">{t("page_size")}</Label>
          <Select
            value={page?.size ?? "__none__"}
            onValueChange={(value) =>
              onUpdate((tpl) => ({
                ...tpl,
                page: {
                  ...tpl.page,
                  size:
                    value === "__none__"
                      ? undefined
                      : (value as "A4" | "A5" | "Letter" | "Legal"),
                },
              }))
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={t("select_page_size")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">{t("none")}</SelectItem>
              <SelectItem value="A4">{t("page_size_a4")}</SelectItem>
              <SelectItem value="A5">{t("page_size_a5")}</SelectItem>
              <SelectItem value="Letter">{t("page_size_letter")}</SelectItem>
              <SelectItem value="Legal">{t("page_size_legal")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-gray-500">
            {t("page_orientation")}
          </Label>
          <Select
            value={page?.orientation ?? "__none__"}
            onValueChange={(value) =>
              onUpdate((tpl) => ({
                ...tpl,
                page: {
                  ...tpl.page,
                  orientation:
                    value === "__none__"
                      ? undefined
                      : (value as "portrait" | "landscape"),
                },
              }))
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={t("select_orientation")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">{t("none")}</SelectItem>
              <SelectItem value="portrait">{t("portrait")}</SelectItem>
              <SelectItem value="landscape">{t("landscape")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs text-gray-500 mb-2 block">
          {t("page_margins_mm")}
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["top", "right", "bottom", "left"] as const).map((side) => (
            <div key={side}>
              <Label className="text-xs capitalize">{t(side)}</Label>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={page?.margin?.[side] ?? ""}
                onChange={(e) => {
                  const val = e.target.value
                    ? parseFloat(e.target.value)
                    : undefined;
                  onUpdate((tpl) => ({
                    ...tpl,
                    page: {
                      ...tpl.page,
                      margin: {
                        top: tpl.page?.margin?.top ?? 0,
                        bottom: tpl.page?.margin?.bottom ?? 0,
                        left: tpl.page?.margin?.left ?? 0,
                        right: tpl.page?.margin?.right ?? 0,
                        [side]: val ?? 0,
                      },
                    },
                  }));
                }}
                placeholder="0"
                className="mt-1"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PrintSetupSection({ template, onUpdate }: SectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      {template.print_setup?.auto_print && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-gray-500 hover:text-red-600"
            onClick={() =>
              onUpdate((tpl) => {
                const { print_setup: _, ...rest } = tpl;
                return rest as PrintTemplate;
              })
            }
          >
            <RotateCcw className="mr-1 size-3" />
            {t("clear")}
          </Button>
        </div>
      )}
      <div className="flex items-center justify-between py-2">
        <div>
          <Label>{t("auto_print")}</Label>
          <p className="text-xs text-gray-500">{t("auto_print_description")}</p>
        </div>
        <Switch
          checked={template.print_setup?.auto_print ?? false}
          onCheckedChange={(checked) =>
            onUpdate((tpl) => ({
              ...tpl,
              print_setup: { ...tpl.print_setup, auto_print: checked },
            }))
          }
        />
      </div>
    </div>
  );
}

function BrandingSection({ template, onUpdate }: SectionProps) {
  const { t } = useTranslation();
  const branding = template.branding;

  const hasBranding =
    branding?.logo?.url ||
    branding?.header_image?.url ||
    branding?.footer_image?.url;

  return (
    <div className="space-y-6">
      {hasBranding && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-gray-500 hover:text-red-600"
            onClick={() =>
              onUpdate((tpl) => {
                const { branding: _, ...rest } = tpl;
                return rest as PrintTemplate;
              })
            }
          >
            <RotateCcw className="mr-1 size-3" />
            {t("clear")}
          </Button>
        </div>
      )}

      {/* Logo */}
      <div className="space-y-3">
        <Label className="font-medium">{t("logo")}</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Label className="text-xs text-gray-500">{t("image_url")}</Label>
            <Input
              value={branding?.logo?.url ?? ""}
              onChange={(e) =>
                onUpdate((tpl) => ({
                  ...tpl,
                  branding: {
                    ...tpl.branding,
                    logo: {
                      alignment: tpl.branding?.logo?.alignment ?? "left",
                      ...tpl.branding?.logo,
                      url: e.target.value,
                    },
                  },
                }))
              }
              placeholder="https://..."
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">{t("width_in_px")}</Label>
            <Input
              type="number"
              min={0}
              value={branding?.logo?.width ?? ""}
              onChange={(e) => {
                const val = e.target.value
                  ? parseFloat(e.target.value)
                  : undefined;
                onUpdate((tpl) => ({
                  ...tpl,
                  branding: {
                    ...tpl.branding,
                    logo: {
                      alignment: tpl.branding?.logo?.alignment ?? "left",
                      url: tpl.branding?.logo?.url ?? "",
                      ...tpl.branding?.logo,
                      width: val,
                    },
                  },
                }));
              }}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">{t("height_in_px")}</Label>
            <Input
              type="number"
              min={0}
              value={branding?.logo?.height ?? ""}
              onChange={(e) => {
                const val = e.target.value
                  ? parseFloat(e.target.value)
                  : undefined;
                onUpdate((tpl) => ({
                  ...tpl,
                  branding: {
                    ...tpl.branding,
                    logo: {
                      alignment: tpl.branding?.logo?.alignment ?? "left",
                      url: tpl.branding?.logo?.url ?? "",
                      ...tpl.branding?.logo,
                      height: val,
                    },
                  },
                }));
              }}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">{t("alignment")}</Label>
            <Select
              value={branding?.logo?.alignment ?? "left"}
              onValueChange={(value) =>
                onUpdate((tpl) => ({
                  ...tpl,
                  branding: {
                    ...tpl.branding,
                    logo: {
                      url: tpl.branding?.logo?.url ?? "",
                      ...tpl.branding?.logo,
                      alignment: value as "left" | "center" | "right",
                    },
                  },
                }))
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">{t("left")}</SelectItem>
                <SelectItem value="center">{t("center")}</SelectItem>
                <SelectItem value="right">{t("right")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {branding?.logo?.url && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-gray-500 hover:text-red-600"
            onClick={() =>
              onUpdate((tpl) => ({
                ...tpl,
                branding: {
                  ...tpl.branding,
                  logo: undefined,
                },
              }))
            }
          >
            <RotateCcw className="mr-1 size-3" />
            {t("clear")}
          </Button>
        )}
      </div>

      <Separator />

      {/* Header Image */}
      <div className="space-y-3">
        <Label className="font-medium">{t("header_image")}</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Label className="text-xs text-gray-500">{t("image_url")}</Label>
            <Input
              value={branding?.header_image?.url ?? ""}
              onChange={(e) =>
                onUpdate((tpl) => ({
                  ...tpl,
                  branding: {
                    ...tpl.branding,
                    header_image: {
                      ...tpl.branding?.header_image,
                      url: e.target.value,
                    },
                  },
                }))
              }
              placeholder="https://..."
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">{t("height_in_px")}</Label>
            <Input
              type="number"
              min={0}
              value={branding?.header_image?.height ?? ""}
              onChange={(e) => {
                const val = e.target.value
                  ? parseFloat(e.target.value)
                  : undefined;
                onUpdate((tpl) => ({
                  ...tpl,
                  branding: {
                    ...tpl.branding,
                    header_image: {
                      url: tpl.branding?.header_image?.url ?? "",
                      ...tpl.branding?.header_image,
                      height: val,
                    },
                  },
                }));
              }}
              className="mt-1"
            />
          </div>
        </div>
        {branding?.header_image?.url && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-gray-500 hover:text-red-600"
            onClick={() =>
              onUpdate((tpl) => ({
                ...tpl,
                branding: {
                  ...tpl.branding,
                  header_image: undefined,
                },
              }))
            }
          >
            <RotateCcw className="mr-1 size-3" />
            {t("clear")}
          </Button>
        )}
      </div>

      <Separator />

      {/* Footer Image */}
      <div className="space-y-3">
        <Label className="font-medium">{t("footer_image")}</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Label className="text-xs text-gray-500">{t("image_url")}</Label>
            <Input
              value={branding?.footer_image?.url ?? ""}
              onChange={(e) =>
                onUpdate((tpl) => ({
                  ...tpl,
                  branding: {
                    ...tpl.branding,
                    footer_image: {
                      ...tpl.branding?.footer_image,
                      url: e.target.value,
                    },
                  },
                }))
              }
              placeholder="https://..."
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">{t("height_in_px")}</Label>
            <Input
              type="number"
              min={0}
              value={branding?.footer_image?.height ?? ""}
              onChange={(e) => {
                const val = e.target.value
                  ? parseFloat(e.target.value)
                  : undefined;
                onUpdate((tpl) => ({
                  ...tpl,
                  branding: {
                    ...tpl.branding,
                    footer_image: {
                      url: tpl.branding?.footer_image?.url ?? "",
                      ...tpl.branding?.footer_image,
                      height: val,
                    },
                  },
                }));
              }}
              className="mt-1"
            />
          </div>
        </div>
        {branding?.footer_image?.url && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-gray-500 hover:text-red-600"
            onClick={() =>
              onUpdate((tpl) => ({
                ...tpl,
                branding: {
                  ...tpl.branding,
                  footer_image: undefined,
                },
              }))
            }
          >
            <RotateCcw className="mr-1 size-3" />
            {t("clear")}
          </Button>
        )}
      </div>
    </div>
  );
}

function WatermarkSection({ template, onUpdate }: SectionProps) {
  const { t } = useTranslation();
  const watermark = template.watermark;

  const hasWatermark = watermark?.enabled || watermark?.text;

  return (
    <div className="space-y-4">
      {hasWatermark && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-gray-500 hover:text-red-600"
            onClick={() =>
              onUpdate((tpl) => {
                const { watermark: _, ...rest } = tpl;
                return rest as PrintTemplate;
              })
            }
          >
            <RotateCcw className="mr-1 size-3" />
            {t("clear")}
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <Label>{t("enable_watermark")}</Label>
          <p className="text-xs text-gray-500">
            {t("enable_watermark_description")}
          </p>
        </div>
        <Switch
          checked={watermark?.enabled ?? false}
          onCheckedChange={(checked) =>
            onUpdate((tpl) => ({
              ...tpl,
              watermark: { ...tpl.watermark, enabled: checked },
            }))
          }
        />
      </div>

      {watermark?.enabled && (
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-gray-500">
              {t("watermark_text")}
            </Label>
            <Input
              value={watermark.text ?? ""}
              onChange={(e) =>
                onUpdate((tpl) => ({
                  ...tpl,
                  watermark: { ...tpl.watermark, text: e.target.value },
                }))
              }
              placeholder={t("watermark_text_placeholder")}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-500">
                {t("opacity")} {"(0-1)"}
              </Label>
              <Input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={watermark.opacity ?? ""}
                onChange={(e) => {
                  const val = e.target.value
                    ? parseFloat(e.target.value)
                    : undefined;
                  onUpdate((tpl) => ({
                    ...tpl,
                    watermark: { ...tpl.watermark, opacity: val },
                  }));
                }}
                placeholder="0.15"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">
                {t("rotation_in_degrees")}
              </Label>
              <Input
                type="number"
                step={1}
                value={watermark.rotation ?? ""}
                onChange={(e) => {
                  const val = e.target.value
                    ? parseFloat(e.target.value)
                    : undefined;
                  onUpdate((tpl) => ({
                    ...tpl,
                    watermark: { ...tpl.watermark, rotation: val },
                  }));
                }}
                placeholder="-45"
                className="mt-1"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
