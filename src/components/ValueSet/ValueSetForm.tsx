import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
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

import useAppHistory from "@/hooks/useAppHistory";

import {
  TERMINOLOGY_SYSTEMS,
  UpdateValuesetModel,
  ValuesetFormType,
} from "@/types/valueset/valueset";

import { CodingField } from "./CodingField";
import { ValueSetPreview } from "./ValueSetPreview";

// Create a schema for form validation

interface ValueSetFormProps {
  initialData?: UpdateValuesetModel;
  onSubmit: (data: ValuesetFormType) => void;
  isSubmitting?: boolean;
  isSystemDefined?: boolean;
}

function ConceptFields({
  nestIndex,
  type,
  parentForm,
  disabled,
}: {
  nestIndex: number;
  type: "include" | "exclude";
  parentForm: ReturnType<typeof useForm<ValuesetFormType>>;
  disabled?: boolean;
}) {
  const { t } = useTranslation(); // Add translation hook
  const { fields, append, remove } = useFieldArray({
    control: parentForm.control,
    name: `compose.${type}.${nestIndex}.concept`,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{t("concepts")}</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ code: "", display: "" })}
          disabled={disabled}
        >
          <PlusIcon className="size-4 mr-2" />
          {t("add_concept")}
        </Button>
      </div>
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-4 items-start">
          <CodingField
            system={parentForm.watch(`compose.${type}.${nestIndex}.system`)}
            name={`compose.${type}.${nestIndex}.concept.${index}`}
            form={parentForm}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(index)}
            disabled={disabled}
          >
            <TrashIcon className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function FilterFields({
  nestIndex,
  type,
  disabled,
  parentForm,
}: {
  nestIndex: number;
  type: "include" | "exclude";
  disabled?: boolean;
  parentForm: ReturnType<typeof useForm<ValuesetFormType>>;
}) {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({
    control: parentForm.control,
    name: `compose.${type}.${nestIndex}.filter`,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{t("filters")}</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ property: "", op: "", value: "" })}
          disabled={disabled}
        >
          <PlusIcon className="size-4 mr-2" />
          {t("add_filter")}
        </Button>
      </div>
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-4 items-start">
          <FormField
            control={parentForm.control}
            name={`compose.${type}.${nestIndex}.filter.${index}.property`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("property")}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={parentForm.control}
            name={`compose.${type}.${nestIndex}.filter.${index}.op`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("operator")}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={parentForm.control}
            name={`compose.${type}.${nestIndex}.filter.${index}.value`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("value")}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(index)}
            disabled={disabled}
          >
            <TrashIcon className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function RuleFields({
  type,
  form,
  disabled,
}: {
  type: "include" | "exclude";
  form: ReturnType<typeof useForm<ValuesetFormType>>;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `compose.${type}`,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">
          {type === "include" ? t("include_rules") : t("exclude_rules")}
        </CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              system: Object.values(TERMINOLOGY_SYSTEMS)[0],
              concept: [],
              filter: [],
            })
          }
          disabled={disabled}
        >
          <PlusIcon className="size-4 mr-2" />
          {t("add_rule")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {fields.map((field, index) => (
          <div key={field.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name={`compose.${type}.${index}.system`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>{t("system")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={disabled}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select_system")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(TERMINOLOGY_SYSTEMS).map(
                          ([key, value]) => (
                            <SelectItem key={key} value={value}>
                              {key}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <Button
                className="mt-5"
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                disabled={disabled}
              >
                <TrashIcon className="size-4" />
              </Button>
            </div>
            <ConceptFields
              nestIndex={index}
              type={type}
              parentForm={form}
              disabled={disabled}
            />
            <FilterFields
              nestIndex={index}
              type={type}
              disabled={disabled}
              parentForm={form}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ValueSetForm({
  initialData,
  onSubmit,
  isSubmitting,
  isSystemDefined,
}: ValueSetFormProps) {
  const { t } = useTranslation();
  const valuesetFormSchema = z.object({
    name: z.string().trim().min(1, t("field_required")),
    slug: z
      .string()
      .trim()
      .min(5, t("character_count_validation", { min: 5, max: 25 }))
      .max(25, t("character_count_validation", { min: 5, max: 25 }))
      .regex(/^[-\w]+$/, { message: t("slug_format_message") }),
    description: z.string(),
    status: z.enum(["active", "draft", "retired", "unknown"]),
    is_system_defined: z.boolean(),
    compose: z.object({
      include: z.array(
        z.object({
          system: z.string(),
          concept: z
            .array(
              z.object({
                code: z.string().min(1, t("field_required")),
                display: z.string().min(1, t("field_required")),
              }),
            )
            .optional(),
          filter: z
            .array(
              z.object({
                property: z.string().min(1, t("field_required")),
                op: z.string().min(1, t("field_required")),
                value: z.string().min(1, t("field_required")),
              }),
            )
            .optional(),
        }),
      ),
      exclude: z.array(
        z.object({
          system: z.string(),
          concept: z
            .array(
              z.object({
                code: z.string().min(1, t("field_required")),
                display: z.string().min(1, t("field_required")),
              }),
            )
            .optional(),
          filter: z
            .array(
              z.object({
                property: z.string().min(1, t("field_required")),
                op: z.string().min(1, t("field_required")),
                value: z.string().min(1, t("field_required")),
              }),
            )
            .optional(),
        }),
      ),
    }),
  });

  const { goBack } = useAppHistory();

  const form = useForm({
    resolver: zodResolver(valuesetFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      description: initialData?.description || "",
      status: initialData?.status || "active",
      is_system_defined: initialData?.is_system_defined || false,
      compose: {
        include: initialData?.compose?.include || [],
        exclude: initialData?.compose?.exclude || [],
      },
    },
  });

  return (
    <Form {...form}>
      <div className="flex justify-end">
        {!initialData?.id && (
          <ValueSetPreview
            valueset={form.watch()}
            trigger={
              <Button variant="outline_primary">
                <CareIcon icon={"l-eye"} className="h-4 w-4" />
                {t("valueset_preview")}
              </Button>
            }
          />
        )}
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          disabled={isSystemDefined}
          render={({ field }) => (
            <FormItem>
              <FormLabel aria-required>{t("name")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          disabled={isSystemDefined}
          render={({ field }) => (
            <FormItem>
              <FormLabel aria-required>{t("slug")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          disabled={isSystemDefined}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("description")}</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
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
                defaultValue={field.value}
                disabled={isSystemDefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_status")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">{t("active")}</SelectItem>
                  <SelectItem value="draft">{t("draft")}</SelectItem>
                  <SelectItem value="retired">{t("retired")}</SelectItem>
                  <SelectItem value="unknown">{t("unknown")}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-6">
          <RuleFields type="include" form={form} disabled={isSystemDefined} />
          <RuleFields type="exclude" form={form} disabled={isSystemDefined} />
        </div>
        {isSystemDefined && (
          <div className="text-red-600 text-sm flex justify-end">
            {t("saving_is_disabled_for_system_valuesets")}
          </div>
        )}
        <div className="flex gap-2 w-full justify-end">
          <Button
            variant="outline"
            disabled={isSubmitting}
            type="button"
            onClick={() => goBack("/admin/valuesets")}
          >
            {t("cancel")}
          </Button>

          <Button
            variant="primary"
            type="submit"
            disabled={
              isSystemDefined || isSubmitting || !form.formState.isDirty
            }
          >
            {isSubmitting ? t("saving") : t("save_valueset")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
