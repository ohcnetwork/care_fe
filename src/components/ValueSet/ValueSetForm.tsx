import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, TrashIcon, UpdateIcon } from "@radix-ui/react-icons";
import { useMutation } from "@tanstack/react-query";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

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

import mutate from "@/Utils/request/mutate";
import {
  TERMINOLOGY_SYSTEMS,
  ValuesetFormType,
  ValuesetLookupResponse,
} from "@/types/valueset/valueset";
import valuesetApi from "@/types/valueset/valuesetApi";

// Create a schema for form validation

interface ValueSetFormProps {
  initialData?: ValuesetFormType;
  onSubmit: (data: ValuesetFormType) => void;
  isSubmitting?: boolean;
}

function ConceptFields({
  nestIndex,
  type,
  parentForm,
}: {
  nestIndex: number;
  type: "include" | "exclude";
  parentForm: ReturnType<typeof useForm<ValuesetFormType>>;
}) {
  const { fields, append, remove } = useFieldArray({
    control: parentForm.control,
    name: `compose.${type}.${nestIndex}.concept`,
  });

  const lookupMutation = useMutation({
    mutationFn: mutate(valuesetApi.lookup, {
      silent: true, // Suppress default error handling since we have custom handling
    }),
    onSuccess: (response: ValuesetLookupResponse) => {
      if (response.metadata) {
        const concepts = parentForm.getValues(
          `compose.${type}.${nestIndex}.concept`,
        );

        const conceptIndex = concepts?.findIndex(
          (concept) => concept.code === response.metadata.code,
        );

        if (conceptIndex != undefined && conceptIndex !== -1) {
          parentForm.setValue(
            `compose.${type}.${nestIndex}.concept.${conceptIndex}.display`,
            response.metadata.display,
            { shouldValidate: true },
          );
        }
        toast.success("Code verified successfully");
      }
    },
    onError: () => {
      toast.error("Failed to verify code");
    },
  });

  const handleVerify = async (index: number) => {
    const system = parentForm.getValues(`compose.${type}.${nestIndex}.system`);
    const code = parentForm.getValues(
      `compose.${type}.${nestIndex}.concept.${index}.code`,
    );

    if (!system || !code) {
      toast.error("Please select a system and enter a code first");
      return;
    }

    lookupMutation.mutate({ system, code });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Concepts</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ code: "", display: "" })}
        >
          <PlusIcon className="size-4 mr-2" />
          Add Concept
        </Button>
      </div>
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-4 items-start">
          <FormField
            control={parentForm.control}
            name={`compose.${type}.${nestIndex}.concept.${index}.code`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Code"
                    onChange={(e) => {
                      field.onChange(e);
                      // Clear display and set isVerified to false when code changes
                      parentForm.setValue(
                        `compose.${type}.${nestIndex}.concept.${index}.display`,
                        "",
                        { shouldValidate: true },
                      );
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={parentForm.control}
            name={`compose.${type}.${nestIndex}.concept.${index}.display`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Unverified"
                    className={!field.value ? "text-gray-500" : undefined}
                    readOnly
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => handleVerify(index)}
            disabled={lookupMutation.isPending}
          >
            <UpdateIcon className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(index)}
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
}: {
  nestIndex: number;
  type: "include" | "exclude";
}) {
  const form = useForm();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `compose.${type}.${nestIndex}.filter`,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Filters</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ property: "", op: "", value: "" })}
        >
          <PlusIcon className="size-4 mr-2" />
          Add Filter
        </Button>
      </div>
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-4 items-start">
          <FormField
            control={form.control}
            name={`compose.${type}.${nestIndex}.filter.${index}.property`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input {...field} placeholder="Property" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`compose.${type}.${nestIndex}.filter.${index}.op`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input {...field} placeholder="Operator" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`compose.${type}.${nestIndex}.filter.${index}.value`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input {...field} placeholder="Value" />
                </FormControl>
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(index)}
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
}: {
  type: "include" | "exclude";
  form: ReturnType<typeof useForm<ValuesetFormType>>;
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `compose.${type}`,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">
          {type === "include" ? "Include Rules" : "Exclude Rules"}
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
        >
          <PlusIcon className="size-4 mr-2" />
          Add Rule
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
                    <FormLabel>System</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select system" />
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
              >
                <TrashIcon className="size-4" />
              </Button>
            </div>
            <ConceptFields nestIndex={index} type={type} parentForm={form} />
            <FilterFields nestIndex={index} type={type} />
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
}: ValueSetFormProps) {
  const { t } = useTranslation();
  const valuesetFormSchema = z.object({
    name: z.string().trim().min(1, t("field_required")),
    slug: z
      .string()
      .trim()
      .min(5, t("character_count_validation", { min: 5, max: 25 }))
      .max(25, t("character_count_validation", { min: 5, max: 25 }))
      .regex(/^[-\w]+$/, {
        message: t("slug_format_message"),
      }),
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
                code: z.string(),
                display: z.string(),
              }),
            )
            .optional(),
          filter: z
            .array(
              z.object({
                property: z.string(),
                op: z.string(),
                value: z.string(),
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
                code: z.string(),
                display: z.string(),
              }),
            )
            .optional(),
          filter: z
            .array(
              z.object({
                property: z.string(),
                op: z.string(),
                value: z.string(),
              }),
            )
            .optional(),
        }),
      ),
    }),
  });

  const { goBack } = useAppHistory();

  const form = useForm<ValuesetFormType>({
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{t("name")}</FormLabel>
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
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{t("slug")}</FormLabel>
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
              <FormLabel required>{t("status")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
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
          <RuleFields type="include" form={form} />
          <RuleFields type="exclude" form={form} />
        </div>

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
            disabled={isSubmitting || !form.formState.isDirty}
          >
            {isSubmitting ? t("saving") : t("save_valueset")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
