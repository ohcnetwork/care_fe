import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
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
import { Select } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { generateSlug } from "@/Utils/utils";
import {
  ResourceCategoryCreate,
  ResourceCategoryRead,
  ResourceCategoryResourceType,
  ResourceCategorySubType,
  ResourceCategoryUpdate,
} from "@/types/base/resourceCategory/resourceCategory";
import resourceCategoryApi from "@/types/base/resourceCategory/resourceCategoryApi";
import { ResourceSubTypePicker } from "./ResourceSubTypePicker";

interface ResourceCategoryFormProps {
  facilityId: string;
  categorySlug?: string;
  parentCategorySlug?: string;
  resourceType: ResourceCategoryResourceType;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (category: ResourceCategoryRead) => void;
}

export function ResourceCategoryForm({
  facilityId,
  categorySlug,
  resourceType,
  parentCategorySlug,
  isOpen,
  onClose,
  onSuccess,
}: ResourceCategoryFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEditing = !!categorySlug;

  const formSchema = z.object({
    title: z.string().min(1, t("field_required")),
    slug_value: z
      .string()
      .min(5, t("character_count_validation", { min: 5, max: 25 }))
      .max(25, t("character_count_validation", { min: 5, max: 25 })),
    description: z.string().optional(),
    resource_sub_type: z.nativeEnum(ResourceCategorySubType),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      slug_value: "",
      description: "",
      resource_sub_type: ResourceCategorySubType.other,
    },
  });

  // Fetch category data for editing
  const { data: categoryData, isLoading: isLoadingCategory } = useQuery({
    queryKey: ["resourceCategory", facilityId, categorySlug],
    queryFn: query(resourceCategoryApi.get, {
      pathParams: { facilityId, slug: categorySlug! },
    }),
    enabled: isEditing && !!categorySlug,
  });

  // Update form when sheet opens - handles both create and edit modes
  useEffect(() => {
    if (!isOpen) return;

    form.reset(
      isEditing && categoryData
        ? {
            title: categoryData.title,
            slug_value: categoryData.slug_config.slug_value,
            description: categoryData.description || "",
            resource_sub_type: categoryData.resource_sub_type,
          }
        : {
            title: "",
            slug_value: "",
            description: "",
            resource_sub_type: ResourceCategorySubType.other,
          },
    );
  }, [isOpen, isEditing, categoryData]);

  // Auto-generate slug from name when creating new category
  useEffect(() => {
    if (isEditing) return;

    const subscription = form.watch((value, { name }) => {
      if (name === "title") {
        form.setValue("slug_value", generateSlug(value.title || "", 25), {
          shouldValidate: true,
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, isEditing]);

  const createMutation = useMutation({
    mutationFn: mutate(resourceCategoryApi.create, {
      pathParams: { facilityId },
    }),
    onSuccess: (data: ResourceCategoryRead) => {
      toast.success(t("category_created_successfully"));
      queryClient.invalidateQueries({
        queryKey: ["resourceCategories"],
      });
      onSuccess?.(data);
      onClose();
    },
    onError: (error) => {
      toast.error(t("failed_to_create_category"));
      console.error("Create category error:", error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: mutate(resourceCategoryApi.update, {
      pathParams: { facilityId, slug: categorySlug! },
    }),
    onSuccess: (data: ResourceCategoryRead) => {
      toast.success(t("category_updated_successfully"));
      queryClient.invalidateQueries({
        queryKey: ["resourceCategories", facilityId],
      });
      onSuccess?.(data);
      onClose();
    },
    onError: (error) => {
      toast.error(t("failed_to_update_category"));
      console.error("Update category error:", error);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const payload: ResourceCategoryCreate | ResourceCategoryUpdate = {
      title: values.title,
      slug_value: values.slug_value,
      description: values.description || undefined,
      parent: parentCategorySlug || undefined,
      resource_type: resourceType,
      resource_sub_type: values.resource_sub_type,
    };

    if (isEditing) {
      updateMutation.mutate(payload as ResourceCategoryUpdate);
    } else {
      createMutation.mutate(payload as ResourceCategoryCreate);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isLoadingCategory) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <FormSkeleton rows={10} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? t("edit_category") : t("create_category")}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? t("edit_category_description")
              : t("create_category_description")}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("enter_category_title")}
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        if (!isEditing) {
                          form.setValue(
                            "slug_value",
                            generateSlug(e.target.value || "", 25),
                            {
                              shouldValidate: true,
                            },
                          );
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("slug")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("enter_category_slug")}
                      {...field}
                      onChange={(e) => {
                        const sanitizedValue = e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_-]/g, "");
                        form.setValue("slug_value", sanitizedValue, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                  </FormControl>
                  <FormDescription>{t("slug_format_message")}</FormDescription>
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
                      placeholder={t("enter_category_description")}
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("category_description_help")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resource_sub_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("resource_sub_type")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <ResourceSubTypePicker
                      resourceType={resourceType}
                      onValueChange={field.onChange}
                      value={field.value}
                    />
                  </Select>
                  <FormDescription>
                    {t("resource_sub_type_help")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && (
                  <CareIcon
                    icon="l-spinner"
                    className="mr-2 h-4 w-4 animate-spin"
                  />
                )}
                {isEditing ? t("update_category") : t("create_category")}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
