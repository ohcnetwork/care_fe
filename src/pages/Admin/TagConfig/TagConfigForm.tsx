import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
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

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { generateSlug } from "@/Utils/utils";
import {
  TagCategory,
  TagConfigRequest,
  TagResource,
  TagStatus,
} from "@/types/emr/tagConfig/tagConfig";
import tagConfigApi from "@/types/emr/tagConfig/tagConfigApi";

interface TagConfigFormProps {
  configId?: string;
  parentId?: string;
  facilityId?: string;
  onSuccess?: () => void;
}

export default function TagConfigForm({
  configId,
  parentId,
  facilityId,
  onSuccess,
}: TagConfigFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEditing = Boolean(configId);
  const isCreatingChild = Boolean(parentId);

  const tagConfigSchema = z.object({
    slug: z.string().trim().min(1, t("field_required")),
    display: z.string().trim().min(1, t("field_required")),
    category: z.nativeEnum(TagCategory, {
      required_error: t("field_required"),
    }),
    description: z.string().optional(),
    priority: z.number().min(0, t("priority_non_negative")),
    status: z.nativeEnum(TagStatus, {
      required_error: t("field_required"),
    }),
    resource: z.nativeEnum(TagResource, {
      required_error: t("field_required"),
    }),
  });

  type TagConfigFormValues = z.infer<typeof tagConfigSchema>;

  // Fetch parent tag data when creating a child
  const { data: parentTag } = useQuery({
    queryKey: ["tagConfig", parentId, facilityId],
    queryFn: query(tagConfigApi.retrieve, {
      pathParams: { external_id: parentId! },
      queryParams: facilityId ? { facility: facilityId } : undefined,
    }),
    enabled: isCreatingChild,
  });

  const form = useForm<TagConfigFormValues>({
    resolver: zodResolver(tagConfigSchema),
    defaultValues: {
      slug: "",
      display: "",
      category: parentTag?.category || TagCategory.CLINICAL,
      description: "",
      priority: parentTag?.priority || 100,
      status: TagStatus.ACTIVE,
      resource: parentTag?.resource || TagResource.PATIENT,
    },
  });

  React.useEffect(() => {
    if (isEditing) return;

    const subscription = form.watch((value, { name }) => {
      if (name === "display") {
        form.setValue("slug", generateSlug(value.display || ""), {
          shouldValidate: true,
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, isEditing]);

  // Fetch existing config data when editing
  const { data: existingConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ["tagConfig", configId, facilityId],
    queryFn: query(tagConfigApi.retrieve, {
      pathParams: { external_id: configId! },
      queryParams: facilityId ? { facility: facilityId } : undefined,
    }),
    enabled: isEditing,
  });

  // Populate form when editing data is loaded
  useEffect(() => {
    if (existingConfig && isEditing) {
      form.reset({
        slug: existingConfig.slug,
        display: existingConfig.display,
        category: existingConfig.category,
        description: existingConfig.description || "",
        priority: existingConfig.priority,
        status: existingConfig.status,
        resource: existingConfig.resource,
      });
    }
  }, [existingConfig, isEditing, form]);

  // Update form when parent tag data is loaded
  useEffect(() => {
    if (parentTag && isCreatingChild) {
      form.reset({
        slug: "",
        display: "",
        category: parentTag.category,
        description: "",
        priority: parentTag.priority,
        status: TagStatus.ACTIVE,
        resource: parentTag.resource,
      });
    }
  }, [parentTag, isCreatingChild, form]);

  const createMutation = useMutation({
    mutationFn: mutate(tagConfigApi.create, {
      queryParams: facilityId ? { facility: facilityId } : undefined,
    }),
    onSuccess: () => {
      toast.success(t("tag_config_created_successfully"));
      queryClient.invalidateQueries({ queryKey: ["tagConfig"] });
      if (parentId) {
        queryClient.invalidateQueries({
          queryKey: ["tagConfig", "children", parentId],
        });
      }
      onSuccess?.();
    },
  });

  const updateMutation = useMutation({
    mutationFn: mutate(tagConfigApi.update, {
      pathParams: { external_id: configId! },
      queryParams: facilityId ? { facility: facilityId } : undefined,
    }),
    onSuccess: () => {
      toast.success(t("tag_config_updated_successfully"));
      queryClient.invalidateQueries({ queryKey: ["tagConfig"] });
      onSuccess?.();
    },
  });

  const onSubmit = (data: TagConfigFormValues) => {
    const payload: TagConfigRequest = {
      slug: data.slug,
      display: data.display,
      category: data.category,
      description: data.description || "",
      priority: data.priority,
      status: data.status,
      resource: data.resource,
      ...(parentId && { parent: parentId }),
      ...(facilityId && { facility: facilityId }),
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading =
    isLoadingConfig || createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="display"
          render={({ field }) => (
            <FormItem>
              <FormLabel aria-required>{t("display_name")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("enter_display_name")}
                  {...field}
                  disabled={isLoading}
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
                <Input
                  placeholder={t("enter_tag_slug")}
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("category")}</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger className="capitalize">
                    <SelectValue placeholder={t("select_category")}>
                      {t(field.value)}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="capitalize">
                  {Object.values(TagCategory).map((category) => (
                    <SelectItem key={category} value={category}>
                      {t(category)}
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
          name="resource"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("resource")}</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isLoading || isEditing}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_resource")}>
                      {t(field.value)}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(TagResource).map((resource) => (
                    <SelectItem key={resource} value={resource}>
                      {t(resource)}
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
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("priority")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={t("enter_priority")}
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value) || 0)
                  }
                  disabled={isLoading}
                />
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
              <FormLabel>{t("status")}</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_status")}>
                      {t(field.value)}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(TagStatus).map((status) => (
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
            <FormItem>
              <FormLabel>{t("description")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("enter_description")}
                  {...field}
                  disabled={isLoading}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Add parent tag info when creating a child */}
        {isCreatingChild && parentTag && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <CareIcon icon="l-info-circle" className="size-4" />
              <span>
                {t("creating_child_tag_for")}{" "}
                <strong>{parentTag.display}</strong>
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-blue-700">
              <div>
                <span className="font-medium">{t("category")}:</span>{" "}
                {t(parentTag.category)}
              </div>
              <div>
                <span className="font-medium">{t("resource")}:</span>{" "}
                {t(parentTag.resource)}
              </div>
              <div>
                <span className="font-medium">{t("priority")}:</span>{" "}
                {parentTag.priority}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={isLoading || !form.formState.isDirty}>
            {isLoading
              ? t("saving")
              : isEditing
                ? t("update_tag_config")
                : t("create_tag_config")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
