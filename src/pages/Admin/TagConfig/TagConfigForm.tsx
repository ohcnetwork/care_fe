import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

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
import {
  TagCategory,
  TagConfigRequest,
  TagResource,
  TagStatus,
} from "@/types/emr/tagConfig/tagConfig";
import tagConfigApi from "@/types/emr/tagConfig/tagConfigApi";

const tagConfigSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  display: z.string().min(1, "Display name is required"),
  category: z.nativeEnum(TagCategory, {
    required_error: "Category is required",
  }),
  description: z.string().optional(),
  priority: z.number().min(0, "Priority must be non-negative"),
  status: z.nativeEnum(TagStatus, {
    required_error: "Status is required",
  }),
  resource: z.nativeEnum(TagResource, {
    required_error: "Resource is required",
  }),
});

type TagConfigFormValues = z.infer<typeof tagConfigSchema>;

interface TagConfigFormProps {
  configId?: string;
  parentId?: string;
  onSuccess?: () => void;
}

export default function TagConfigForm({
  configId,
  parentId,
  onSuccess,
}: TagConfigFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEditing = Boolean(configId);

  const form = useForm<TagConfigFormValues>({
    resolver: zodResolver(tagConfigSchema),
    defaultValues: {
      slug: "",
      display: "",
      category: TagCategory.CLINICAL,
      description: "",
      priority: 100,
      status: TagStatus.ACTIVE,
      resource: TagResource.PATIENT,
    },
  });

  // Fetch existing config data when editing
  const { data: existingConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ["tagConfig", configId],
    queryFn: query(tagConfigApi.retrieve, {
      pathParams: { external_id: configId! },
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

  const createMutation = useMutation({
    mutationFn: mutate(tagConfigApi.create),
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
    onError: (error: any) => {
      toast.error(error?.message || t("failed_to_create_tag_config"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: mutate(tagConfigApi.update, {
      pathParams: { external_id: configId! },
    }),
    onSuccess: () => {
      toast.success(t("tag_config_updated_successfully"));
      queryClient.invalidateQueries({ queryKey: ["tagConfig"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error?.message || t("failed_to_update_tag_config"));
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
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("slug")}</FormLabel>
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
          name="display"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("display_name")}</FormLabel>
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
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("category")}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_category")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
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
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_resource")} />
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
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_status")} />
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

        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={isLoading}>
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
