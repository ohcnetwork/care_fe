import { zodResolver } from "@hookform/resolvers/zod";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

import CareIcon from "@/CAREUI/icons/CareIcon";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { Permission } from "@/types/emr/permission/permission";
import permissionApi from "@/types/emr/permission/permissionApi";
import { RoleRead } from "@/types/emr/role/role";
import roleApi from "@/types/emr/role/roleApi";
import { useInView } from "react-intersection-observer";

interface RoleFormProps {
  role: RoleRead | null;
  onSuccess: () => void;
}

const PAGE_LIMIT = 100;

export default function RoleForm({ role, onSuccess }: RoleFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { ref, inView } = useInView();
  const [searchPermission, setSearchPermission] = useState("");

  const isEditMode = !!role?.id;

  const roleSchema = z.object({
    name: z.string().trim().min(1, t("name_is_required")),
    description: z.string().trim().optional(),
    permissions: z
      .array(z.string())
      .min(1, t("at_least_one_permission_required")),
    is_archived: z.boolean().default(false),
  });

  const form = useForm({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
      permissions: role?.permissions.map((p) => p.slug) || [],
      is_archived: role?.is_archived ?? false,
    },
  });

  const { isDirty } = form.formState;
  const watchedPermissions = form.watch("permissions");
  const hasPermissionSelected =
    watchedPermissions && watchedPermissions.length > 0;

  const getQueryParams = (pageParam: number, name: string) => ({
    limit: String(PAGE_LIMIT),
    offset: String(pageParam),
    name: name,
  });

  const {
    data: permissionsList,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["permissions", searchPermission],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query.debounced(permissionApi.listPermissions, {
        queryParams: getQueryParams(pageParam, searchPermission),
      })({ signal });
      return response;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentOffset = allPages.length * PAGE_LIMIT;
      return currentOffset < lastPage.count ? currentOffset : null;
    },
    select: (data) => data?.pages.flatMap((p) => p.results) || [],
  });

  const permissions: Permission[] = permissionsList || [];

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage();
  }, [inView, hasNextPage, fetchNextPage]);

  const createRoleMutation = useMutation({
    mutationFn: mutate(roleApi.createRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      onSuccess();
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: mutate(roleApi.updateRole, {
      pathParams: { external_id: role?.id || "" },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      onSuccess();
    },
  });

  useEffect(() => {
    form.reset({
      name: role?.name || "",
      description: role?.description || "",
      permissions: role?.permissions.map((p) => p.slug) || [],
      is_archived: role?.is_archived ?? false,
    });
  }, [form, role]);

  const onSubmit = (data: z.infer<typeof roleSchema>) => {
    const payload = {
      name: data.name,
      description: data.description,
      permissions: data.permissions,
      is_archived: data.is_archived,
    };

    if (isEditMode) {
      updateRoleMutation.mutate(payload);
    } else {
      createRoleMutation.mutate(payload);
    }
  };

  const isLoading =
    createRoleMutation.isPending || updateRoleMutation.isPending;

  const handlePermissionToggle = (slug: string) => {
    const current = form.watch("permissions") || [];
    if (current.includes(slug)) {
      form.setValue(
        "permissions",
        current.filter((s) => s !== slug),
        { shouldValidate: true, shouldDirty: true },
      );
    } else {
      form.setValue("permissions", [...current, slug], {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const handleSelectAll = () => {
    form.setValue(
      "permissions",
      permissions.map((p) => p.slug),
      { shouldValidate: true, shouldDirty: true },
    );
  };

  const handleClearAll = () => {
    form.setValue("permissions", [], {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleCancel = () => {
    form.reset();
    onSuccess();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col space-y-6 max-h-[calc(100vh-7rem)]"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="name" aria-required="true">
                {t("name")}
              </FormLabel>
              <FormControl>
                <Input
                  id="name"
                  placeholder={t("enter_role_name")}
                  {...field}
                />
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
              <FormLabel htmlFor="description">{t("description")}</FormLabel>
              <FormControl>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder={t("enter_role_description")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isEditMode && (
          <FormField
            control={form.control}
            name="is_archived"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="mb-2">{t("status")}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(val) => field.onChange(val === "true")}
                    value={String(field.value)}
                    className="flex space-x-4"
                  >
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <RadioGroupItem value="false" id="unarchive" />
                      </FormControl>
                      <FormLabel htmlFor="unarchive" className="cursor-pointer">
                        {t("unarchive")}
                      </FormLabel>
                    </FormItem>

                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <RadioGroupItem value="true" id="archive" />
                      </FormControl>
                      <FormLabel htmlFor="archive" className="cursor-pointer">
                        {t("archive")}
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <Card className="flex flex-col min-h-80">
          <CardHeader className="flex flex-col">
            <div className="flex items-center justify-between">
              <CardTitle>{t("permissions")}</CardTitle>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {t("select_all")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                >
                  {t("clear")}
                </Button>
              </div>
            </div>
            <div className="relative">
              <CareIcon
                icon="l-search"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 size-4"
              />
              <Input
                placeholder={t("search_permissions")}
                value={searchPermission}
                onChange={(e) => setSearchPermission(e.target.value)}
                className="w-full pl-8"
              />
            </div>
          </CardHeader>
          <CardContent className="overflow-auto">
            <FormField
              control={form.control}
              name="permissions"
              render={() => (
                <FormItem>
                  <div className="space-y-3 max-h-60 mr-2">
                    {permissions.map((permission, index) => (
                      <div
                        key={permission.slug}
                        className="flex items-center space-x-2"
                        ref={index === permissions.length - 1 ? ref : undefined}
                      >
                        <Checkbox
                          id={permission.slug}
                          checked={watchedPermissions?.includes(
                            permission.slug,
                          )}
                          onCheckedChange={() =>
                            handlePermissionToggle(permission.slug)
                          }
                        />
                        <Label
                          htmlFor={permission.slug}
                          className="flex-1 cursor-pointer"
                        >
                          <div>
                            <div className="font-medium">{permission.name}</div>
                            {permission.description && (
                              <div className="text-sm text-gray-500">
                                {permission.description}
                              </div>
                            )}
                          </div>
                        </Label>
                      </div>
                    ))}
                    {(isFetching || isFetchingNextPage) && (
                      <div className="text-center text-sm">{t("loading")}</div>
                    )}
                    {!isFetching && permissions.length === 0 && (
                      <div className="text-center text-sm">
                        {t("no_matching_permissions")}
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            disabled={!isDirty || isLoading || !hasPermissionSelected}
          >
            {isLoading
              ? t("saving")
              : isEditMode
                ? t("update_role")
                : t("create_role")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
