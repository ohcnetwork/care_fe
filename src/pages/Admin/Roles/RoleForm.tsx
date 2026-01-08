import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import CareIcon from "@/CAREUI/icons/CareIcon";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Permission } from "@/types/emr/permission/permission";
import permissionApi from "@/types/emr/permission/permissionApi";
import { RoleRead } from "@/types/emr/role/role";
import roleApi from "@/types/emr/role/roleApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";

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
  const isEditMode = Boolean(role?.id);

  useEffect(() => {
    form.reset({
      name: role?.name || "",
      description: role?.description || "",
      permissions: role?.permissions.map((p: Permission) => p.slug) || [],
    });
  }, [role]);

  const formSchema = z.object({
    name: z.string().trim().min(1, t("field_required")),
    description: z.string().optional(),
    permissions: z
      .array(z.string())
      .min(1, t("at_least_one_permission_required")),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
      permissions: role?.permissions.map((p: Permission) => p.slug) || [],
    },
  });

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

  const permissions = permissionsList || [];

  const createRoleMutation = useMutation({
    mutationFn: mutate(roleApi.createRole),
    onSuccess: () => {
      toast.success(t("role_created_successfully"));
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      onSuccess();
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: mutate(roleApi.updateRole, {
      pathParams: { external_id: role?.id || "" },
    }),
    onSuccess: () => {
      toast.success(t("role_updated_successfully"));
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      onSuccess();
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const payload = {
      name: values.name,
      description: values.description,
      permissions: values.permissions,
    };

    if (isEditMode) {
      updateRoleMutation.mutate(payload);
    } else {
      createRoleMutation.mutate(payload);
    }
  };

  const handlePermissionToggle = (permissionSlug: string) => {
    const currentPermissions = form.getValues("permissions");
    form.setValue(
      "permissions",
      currentPermissions.includes(permissionSlug)
        ? currentPermissions.filter((slug) => slug !== permissionSlug)
        : [...currentPermissions, permissionSlug],
      {
        shouldValidate: true,
        shouldDirty: true,
      },
    );
  };

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage();
  }, [inView, hasNextPage, fetchNextPage]);

  const isLoading =
    createRoleMutation.isPending || updateRoleMutation.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col space-y-6 max-h-[calc(100vh-7rem)]"
      >
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel aria-required>{t("name")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("enter_role_name")} {...field} />
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
                  <Textarea
                    placeholder={t("enter_role_description")}
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="permissions"
          render={() => (
            <>
              <Card className="flex flex-col min-h-80">
                <CardHeader className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <CardTitle>{t("permissions")}</CardTitle>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          form.setValue(
                            "permissions",
                            permissions.map((p) => p.slug),
                            {
                              shouldValidate: true,
                              shouldDirty: true,
                            },
                          )
                        }
                      >
                        {t("select_all")}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          form.setValue("permissions", [], {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
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
                  <div className="space-y-3 h-full pr-2">
                    {permissions.map((permission, index) => (
                      <div
                        key={permission.slug}
                        className="flex items-center space-x-2"
                        ref={index === permissions.length - 1 ? ref : undefined}
                      >
                        <Checkbox
                          id={permission.slug}
                          checked={form
                            .watch("permissions")
                            ?.includes(permission.slug)}
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

                    {isFetching ? (
                      <div className="text-center text-sm">{t("loading")}</div>
                    ) : (
                      permissions.length === 0 && (
                        <div className="text-center text-sm">
                          {t("no_matching_permissions")}
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
              <FormMessage className="-mt-4" />
            </>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            disabled={isLoading}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={isLoading || !form.formState.isDirty}>
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
