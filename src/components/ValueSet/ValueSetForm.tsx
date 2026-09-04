import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { useId, useState } from "react";
import { useFieldArray, useForm, type UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import {
  TERMINOLOGY_SYSTEMS,
  ValueSetBase,
  ValueSetInclude,
  ValueSetRead,
  ValueSetScope,
  ValueSetStatus,
} from "@/types/valueSet/valueSet";
import { goBack, valuesOf } from "@/Utils/utils";

import { generateSlug } from "@/Utils/utils";
import { CodingField } from "./CodingField";
import { ScopedValueSet } from "./useScopedValueSets";
import { ValueSetParentPicker } from "./ValueSetParentPicker";
import { ValueSetPreview } from "./ValueSetPreview";

/** What the form hands back: the editable fields plus the create-only
 *  lineage (`parent` / `inherited`), which the backend ignores on update. */
export interface ValueSetFormSubmit extends ValueSetBase {
  parent?: string;
  inherited: boolean;
}

interface ValueSetFormProps {
  scope: ValueSetScope;
  initialData?: ValueSetRead;
  /** Pre-selected parent for a new set (the list's Customize action). */
  initialParent?: ValueSetRead;
  onSubmit: (data: ValueSetFormSubmit) => void;
  isSubmitting?: boolean;
  isReadOnly?: boolean;
}

interface ValueSetFormInclude extends Omit<ValueSetInclude, "version"> {
  version: string;
}

interface ValueSetFormData extends Omit<ValueSetBase, "compose"> {
  compose: {
    exclude: ValueSetFormInclude[];
    include: ValueSetFormInclude[];
  };
  parent?: string;
  inherited: boolean;
}

const SLUG_MIN = 5;
const SLUG_MAX = 25;

function ConceptFields({
  nestIndex,
  type,
  parentForm,
  disabled,
}: {
  nestIndex: number;
  type: "include" | "exclude";
  parentForm: UseFormReturn<ValueSetFormData>;
  disabled?: boolean;
}) {
  const { t } = useTranslation(); // Add translation hook
  const { fields, append, remove } = useFieldArray({
    control: parentForm.control,
    name: `compose.${type}.${nestIndex}.concept`,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h4 className="text-sm font-medium">{t("concepts")}</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ code: "", display: "" })}
          disabled={disabled}
          className="w-full sm:w-auto"
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
            onRemove={() => remove(index)}
            removeDisabled={disabled}
          />
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
  parentForm: UseFormReturn<ValueSetFormData>;
}) {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({
    control: parentForm.control,
    name: `compose.${type}.${nestIndex}.filter`,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h4 className="text-sm font-medium">{t("filters")}</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ property: "", op: "", value: "" })}
          disabled={disabled}
          className="w-full sm:w-auto"
        >
          <PlusIcon className="size-4 mr-2" />
          {t("add_filter")}
        </Button>
      </div>
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-4 items-start">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-1">
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
          </div>
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
  form: UseFormReturn<ValueSetFormData>;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `compose.${type}`,
  });

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-2 p-4 sm:p-6">
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
              version: "",
              concept: [],
              filter: [],
            })
          }
          disabled={disabled}
          className="w-full sm:w-auto"
        >
          <PlusIcon className="size-4 mr-2" />
          {t("add_rule")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6 p-4 sm:p-6 pt-0">
        {fields.map((field, index) => (
          <div key={field.id} className="space-y-4">
            <div className="flex items-end gap-4">
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
                        <SelectTrigger ref={field.ref}>
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
              <FormField
                control={form.control}
                name={`compose.${type}.${index}.version`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>{t("version")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("version")}
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

/**
 * Create-only lineage for a facility set. A parent makes the new set an
 * extension of it (the backend merges both compositions); switching
 * "replace" on makes it `inherited`, which pins the slug to the parent's so
 * the new set is what that slug resolves to inside this facility.
 */
function BasedOnFields({
  facilityId,
  form,
  parent,
  parentScope,
  onParentChange,
  disabled,
}: {
  facilityId: string;
  form: UseFormReturn<ValueSetFormData>;
  parent?: ValueSetRead;
  parentScope: ScopedValueSet["authContext"];
  onParentChange: (
    parent: ValueSetRead | undefined,
    scope: ScopedValueSet["authContext"],
  ) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const parentLabelId = useId();
  const authoredSlug = () => generateSlug(form.getValues("name"), SLUG_MAX);

  // Replacing means taking the parent's slug, which inside one facility
  // would collide with a facility parent under the backend's per-facility
  // slug constraint. Only an instance parent can be replaced.
  const canReplace = !!parent && parentScope === "instance";

  const handleParentChange = (
    option: ScopedValueSet | undefined,
    scope = option?.authContext ?? "instance",
  ) => {
    const next = option?.valueset;
    onParentChange(next, scope);
    form.setValue("parent", next?.id, { shouldDirty: true });
    const keepsInherited =
      !!next && scope === "instance" && form.getValues("inherited");
    form.setValue("inherited", keepsInherited, { shouldDirty: true });
    // The slug follows the parent while replacing, and reverts to one
    // authored from the name otherwise — leaving the parent's slug behind
    // on a plain extension would submit a "system-…" slug the backend
    // rejects.
    form.setValue("slug", keepsInherited ? next.slug : authoredSlug(), {
      shouldValidate: true,
    });
  };

  const handleInheritedChange = (checked: boolean) => {
    form.setValue("inherited", checked, { shouldDirty: true });
    form.setValue("slug", checked && parent ? parent.slug : authoredSlug(), {
      shouldValidate: true,
    });
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6 pb-2">
        <CardTitle className="text-lg font-medium">{t("based_on")}</CardTitle>
        <CardDescription>{t("based_on_valueset_hint")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
        <div className="space-y-2">
          <Label id={parentLabelId}>{t("parent_value_set")}</Label>
          <ValueSetParentPicker
            facilityId={facilityId}
            value={parent}
            onChange={handleParentChange}
            disabled={disabled}
            aria-labelledby={parentLabelId}
          />
        </div>
        <FormField
          control={form.control}
          name="inherited"
          render={({ field }) => (
            <FormItem className="flex items-start gap-3 space-y-0">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={handleInheritedChange}
                  disabled={disabled || !canReplace}
                />
              </FormControl>
              <div className="space-y-1">
                <FormLabel>{t("replace_parent_in_facility")}</FormLabel>
                <FormDescription>
                  {parent && !canReplace
                    ? t("replace_parent_instance_only")
                    : t("replace_parent_in_facility_hint")}
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

export function ValueSetForm({
  scope,
  initialData,
  initialParent,
  onSubmit,
  isSubmitting,
  isReadOnly,
}: ValueSetFormProps) {
  const { t } = useTranslation();
  const [parent, setParent] = useState<ValueSetRead | undefined>(initialParent);
  // The seeded parent always comes from the list's Instance tab, which is
  // the only place Customize is offered.
  const [parentScope, setParentScope] =
    useState<ScopedValueSet["authContext"]>("instance");
  // Lineage is create-only, and only a facility can extend another set.
  const showBasedOn = !initialData && scope.authContext === "facility";

  const conceptSchema = z.object({
    code: z.string().min(1, t("field_required")),
    display: z.string().min(1, t("field_required")),
  });
  const filterSchema = z.object({
    property: z.string().min(1, t("field_required")),
    op: z.string().min(1, t("field_required")),
    value: z.string().min(1, t("field_required")),
  });
  const ruleSchema = z.object({
    system: z.string(),
    version: z.string(),
    concept: z.array(conceptSchema).optional(),
    filter: z.array(filterSchema).optional(),
  });
  const valuesetFormSchema = z
    .object({
      name: z.string().trim().min(1, t("field_required")),
      slug: z.string().trim(),
      description: z.string(),
      status: z.enum([
        ValueSetStatus.ACTIVE,
        ValueSetStatus.DRAFT,
        ValueSetStatus.RETIRED,
        ValueSetStatus.UNKNOWN,
      ]),
      is_system_defined: z.boolean(),
      compose: z.object({
        include: z.array(ruleSchema),
        exclude: z.array(ruleSchema),
      }),
      parent: z.string().optional(),
      inherited: z.boolean(),
    })
    .superRefine((data, ctx) => {
      // These are authoring rules for a NEW slug. They do not apply to a
      // slug the server assigned: an inherited set takes its parent's
      // verbatim, and an existing set keeps its own — several system slugs
      // are longer than SLUG_MAX, and re-validating them here would make
      // those sets impossible to save.
      if (data.inherited || data.slug === initialData?.slug) return;
      if (data.slug.length < SLUG_MIN || data.slug.length > SLUG_MAX) {
        ctx.addIssue({
          code: "custom",
          path: ["slug"],
          message: t("character_count_validation", {
            min: SLUG_MIN,
            max: SLUG_MAX,
          }),
        });
      } else if (!/^[-\w]+$/.test(data.slug)) {
        ctx.addIssue({
          code: "custom",
          path: ["slug"],
          message: t("slug_format_message"),
        });
      }
    });

  const form = useForm<ValueSetFormData>({
    resolver: zodResolver(valuesetFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || initialParent?.slug || "",
      description: initialData?.description || "",
      status: initialData?.status || ValueSetStatus.ACTIVE,
      is_system_defined: initialData?.is_system_defined || false,
      compose: {
        include:
          initialData?.compose?.include.map((rule) => ({
            ...rule,
            version: rule.version ?? "",
          })) || [],
        exclude:
          initialData?.compose?.exclude.map((rule) => ({
            ...rule,
            version: rule.version ?? "",
          })) || [],
      },
      parent: initialParent?.id,
      // Customize defaults to replacing the parent — that is the whole
      // point of the flow; a plain extension is the opt-out.
      inherited: !!initialParent,
    },
  });

  const inherited = form.watch("inherited");

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
          disabled={isReadOnly}
          render={({ field }) => (
            <FormItem>
              <FormLabel aria-required>{t("name")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    if (form.getValues("inherited")) return;
                    form.setValue(
                      "slug",
                      generateSlug(e.target.value, SLUG_MAX),
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
          disabled={isReadOnly}
          render={({ field }) => (
            <FormItem>
              <FormLabel aria-required>{t("slug")}</FormLabel>
              <FormControl>
                {/* Locked on the element, not the Controller: a Controller
                    marked disabled drops its value from the submitted data,
                    and the inherited slug still has to reach the backend. */}
                <Input
                  {...field}
                  disabled={isReadOnly || inherited}
                  onChange={(e) => {
                    const sanitizedValue = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9_-]/g, "");
                    form.setValue("slug", sanitizedValue, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </FormControl>
              <FormMessage />
              <FormDescription>
                {inherited
                  ? t("replace_parent_slug_locked")
                  : t("slug_format_message")}
              </FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          disabled={isReadOnly}
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
                disabled={isReadOnly}
              >
                <FormControl>
                  <SelectTrigger ref={field.ref}>
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

        {showBasedOn && (
          <BasedOnFields
            facilityId={scope.facilityId}
            form={form}
            parent={parent}
            parentScope={parentScope}
            onParentChange={(next, nextScope) => {
              setParent(next);
              setParentScope(nextScope);
            }}
            disabled={isReadOnly}
          />
        )}

        <div className="space-y-6">
          <RuleFields type="include" form={form} disabled={isReadOnly} />
          <RuleFields type="exclude" form={form} disabled={isReadOnly} />
        </div>
        {isReadOnly && (
          <div className="text-red-600 text-sm flex justify-end">
            {t(
              initialData?.is_system_defined
                ? "saving_is_disabled_for_system_valuesets"
                : "no_permission_to_edit_valueset",
            )}
          </div>
        )}
        <div className="flex gap-2 w-full justify-end">
          <Button
            variant="outline"
            disabled={isSubmitting}
            type="button"
            onClick={() => goBack(scope.basePath)}
          >
            {t("cancel")}
          </Button>

          <Button
            variant="primary"
            type="submit"
            disabled={isReadOnly || isSubmitting || !form.formState.isDirty}
          >
            {isSubmitting ? t("saving") : t("save_valueset")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
