import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";

import {
  cleanPrintTemplate,
  getPrintTemplateErrors,
  PrintTemplateEditor,
} from "@/components/Facility/PrintTemplateEditor";

import mutate from "@/Utils/request/mutate";
import { useNavigationBlocker } from "@/hooks/useNavigationBlocker";
import type { FacilityRead } from "@/types/facility/facility";
import facilityApi from "@/types/facility/facilityApi";
import {
  PrintTemplateType,
  type PrintTemplate,
} from "@/types/facility/printTemplate";

const TEMPLATE_TYPES: string[] = Object.values(PrintTemplateType);

interface PrintTemplateSheetProps {
  facility: FacilityRead;
  /** The print type being edited; `null` closes the sheet. */
  slug: string | null;
  onClose: () => void;
}

/** Edits and saves the facility's template for one print type. */
export function PrintTemplateSheet({
  facility,
  slug,
  onClose,
}: PrintTemplateSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const templates = facility.print_templates ?? [];
  const [draft, setDraft] = useState<PrintTemplate | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  // Keep rendering the last opened template while the sheet animates closed.
  const [shownSlug, setShownSlug] = useState(slug);
  const [openedSlug, setOpenedSlug] = useState(slug);
  if (slug !== openedSlug) {
    setOpenedSlug(slug);
    if (slug) {
      setShownSlug(slug);
      setDraft(null);
    }
  }

  const name = shownSlug && templateName(shownSlug, t);
  const isDefault = shownSlug === PrintTemplateType.default;
  const isKnownType = !!shownSlug && TEMPLATE_TYPES.includes(shownSlug);
  const defaultTemplate = templates.find(
    (template) => template.slug === PrintTemplateType.default,
  );
  // Earlier duplicates of a type are ignored when printing.
  const saved = templates.find((template) => template.slug === shownSlug);
  // A type's template replaces the default one entirely, so a new one starts
  // with the default's settings instead of losing them.
  const base = !saved && !isDefault ? defaultTemplate : undefined;
  const startsFromDefault = !!base;
  const initial: PrintTemplate = saved ?? { ...base, slug: shownSlug ?? "" };
  const template = draft ?? initial;
  const isDirty =
    JSON.stringify(cleanPrintTemplate(template)) !==
    JSON.stringify(cleanPrintTemplate(initial));
  const errors = getPrintTemplateErrors(template);
  useNavigationBlocker(!!slug && isDirty, t("unsaved_changes_warning"));

  const { mutate: savePrintTemplates, isPending } = useMutation({
    mutationFn: mutate(facilityApi.update, {
      pathParams: { facilityId: facility.id },
    }),
    onSuccess: (updatedFacility) => {
      queryClient.setQueryData(["facility", facility.id], updatedFacility);
      queryClient.invalidateQueries({ queryKey: ["facility", facility.id] });
      toast.success(t("print_templates_updated"));
      onClose();
    },
  });

  const update = (print_templates: PrintTemplate[]) =>
    savePrintTemplates({
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
      print_templates,
    });

  const handleSave = () => {
    if (isPending || errors.margin || errors.opacity) return;
    const cleaned = cleanPrintTemplate(template);
    const index = templates.findIndex((tpl) => tpl.slug === shownSlug);
    update(
      index === -1
        ? [...templates, cleaned]
        : // Saving also drops ignored duplicates of this type.
          templates.flatMap((tpl, i) =>
            tpl.slug !== shownSlug ? [tpl] : i === index ? [cleaned] : [],
          ),
    );
  };

  const requestClose = () => {
    if (isPending) return;
    if (isDirty && !window.confirm(t("unsaved_changes_warning"))) return;
    onClose();
  };

  const removeLabel = t(
    isKnownType && !isDefault ? "reset_to_default" : "remove_template",
  );

  return (
    <>
      <Sheet
        open={!!slug}
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
      >
        <SheetContent size="md" className="overflow-hidden">
          {shownSlug && (
            <form
              noValidate
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={(event) => {
                event.preventDefault();
                handleSave();
              }}
            >
              <SheetHeader>
                <SheetTitle>{t("print_template_title", { name })}</SheetTitle>
                <SheetDescription>
                  {isDefault
                    ? t("print_template_default_description")
                    : !isKnownType
                      ? t("print_template_unrecognized_description")
                      : startsFromDefault
                        ? t("print_template_copy_description", { name })
                        : t("print_template_type_description", { name })}
                </SheetDescription>
              </SheetHeader>
              <SheetBody>
                <fieldset disabled={isPending} className="min-w-0">
                  <PrintTemplateEditor
                    template={template}
                    onChange={(updater) =>
                      setDraft((previous) => updater(previous ?? initial))
                    }
                  />
                </fieldset>
              </SheetBody>
              <SheetFooter>
                {saved && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive hover:text-destructive sm:mr-auto"
                    disabled={isPending}
                    onClick={() => setConfirmRemove(true)}
                  >
                    <Trash2 />
                    {removeLabel}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={requestClose}
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isPending ||
                    errors.margin ||
                    errors.opacity ||
                    (!!saved && !isDirty)
                  }
                >
                  {isPending && <Spinner className="size-4" />}
                  {t("save")}
                </Button>
              </SheetFooter>
            </form>
          )}
        </SheetContent>
      </Sheet>
      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(
                isKnownType && !isDefault
                  ? "print_template_reset_title"
                  : "print_template_remove_title",
                { name },
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isDefault
                ? t("print_template_remove_default_description")
                : !isKnownType
                  ? t("print_template_remove_unrecognized_description")
                  : defaultTemplate
                    ? t("print_template_reset_description", { name })
                    : t("print_template_reset_standard_description", { name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                update(templates.filter((tpl) => tpl.slug !== shownSlug));
                setConfirmRemove(false);
              }}
            >
              {removeLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** A print type's translated name; unrecognized identifiers are shown as-is. */
export function templateName(slug: string, t: (key: string) => string) {
  return TEMPLATE_TYPES.includes(slug) ? t(slug) : slug;
}
