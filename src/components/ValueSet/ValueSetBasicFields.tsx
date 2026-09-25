import type { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { ValueSetRead, ValueSetStatus } from "@/types/valueSet/valueSet";

import { generateSlug, valuesOf } from "@/Utils/utils";

import { SLUG_MAX, type ValueSetFormData } from "./valueSetFormTypes";

interface ValueSetBasicFieldsProps {
  form: UseFormReturn<ValueSetFormData>;
  initialData?: ValueSetRead;
  inherited: boolean;
  isSlugManuallyEdited: boolean;
  onSlugManuallyEdited: () => void;
  disabled?: boolean;
  isSharedSlugCheckBlocked: boolean;
  showSharedCatalogueError: boolean;
  onRetrySharedCatalogue: () => void;
}

export function ValueSetBasicFields({
  form,
  initialData,
  inherited,
  isSlugManuallyEdited,
  onSlugManuallyEdited,
  disabled,
  isSharedSlugCheckBlocked,
  showSharedCatalogueError,
  onRetrySharedCatalogue,
}: ValueSetBasicFieldsProps) {
  const { t } = useTranslation();
  return (
    <section className="space-y-4 border-b border-gray-200 pb-6">
      <h2 className="text-base font-semibold tracking-tight text-gray-900">
        {t("basic_information")}
      </h2>
      <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_180px]">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel aria-required>{t("name")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={disabled}
                  className="h-12 md:h-10"
                  placeholder={t("valueset_name_placeholder")}
                  onChange={(event) => {
                    field.onChange(event);
                    if (
                      initialData ||
                      form.getValues("inherited") ||
                      isSlugManuallyEdited
                    ) {
                      return;
                    }
                    form.setValue(
                      "slug",
                      generateSlug(event.target.value, SLUG_MAX),
                      {
                        shouldValidate: true,
                        shouldDirty: false,
                      },
                    );
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel aria-required>{t("slug")}</FormLabel>
              <FormControl>
                {/* Locked on the element, not the Controller: a
                            disabled Controller drops its value from submitted
                            data, but existing and inherited slugs must still
                            reach the backend. */}
                <Input
                  {...field}
                  disabled={disabled || !!initialData || inherited}
                  className="h-12 font-mono text-sm md:h-10"
                  onChange={(event) => {
                    const sanitizedValue = event.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9_-]/g, "");
                    onSlugManuallyEdited();
                    form.setValue("slug", sanitizedValue, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </FormControl>
              <FormMessage />
              <FormDescription>
                {initialData
                  ? t("valueset_slug_locked")
                  : inherited
                    ? t("replace_parent_slug_locked")
                    : t("slug_format_message")}
                {isSharedSlugCheckBlocked && (
                  <span
                    className="mt-2 block"
                    role={showSharedCatalogueError ? "alert" : "status"}
                  >
                    {t(
                      showSharedCatalogueError
                        ? "valueset_slug_check_failed"
                        : "valueset_slug_checking",
                    )}
                    {showSharedCatalogueError && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 block"
                        onClick={onRetrySharedCatalogue}
                      >
                        {t("try_again")}
                      </Button>
                    )}
                  </span>
                )}
              </FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel aria-required>{t("status")}</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger
                    ref={field.ref}
                    className="w-full data-[size=default]:h-12 md:data-[size=default]:h-10"
                  >
                    <SelectValue placeholder={t("select_status")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {valuesOf(ValueSetStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="sm:col-span-2 lg:col-span-3">
              <FormLabel>
                {t("description")}{" "}
                <span className="font-normal text-gray-500">
                  ({t("optional")})
                </span>
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  disabled={disabled}
                  className="min-h-16 resize-y py-2"
                  rows={2}
                  placeholder={t("valueset_description_placeholder")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </section>
  );
}
