import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { toast } from "sonner";

interface RoleFormProps {
  role: RoleRead | null;
  onSuccess: () => void;
}
const PAGE_LIMIT = 100;
export default function RoleForm({ role, onSuccess }: RoleFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchPermission, setSearchPermission] = useState("");
  const isEditMode = Boolean(role?.id);

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

  useEffect(() => {
    form.reset({
      name: role?.name || "",
      description: role?.description || "",
      permissions: role?.permissions.map((p: Permission) => p.slug) || [],
    });
  }, [role]);

  const { data: permissionsList, isLoading: permissionsLoading } = useQuery({
    queryKey: ["permissions", searchPermission],
    queryFn: query.paginated(permissionApi.listPermissions, {
      queryParams: {
        name: searchPermission,
      },
      pageSize: PAGE_LIMIT,
    }),
  });

  const permissions = permissionsList?.results || [];

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

  const isLoading =
    createRoleMutation.isPending ||
    updateRoleMutation.isPending ||
    permissionsLoading;

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

        <FormField
          control={form.control}
          name="permissions"
          render={({ field }) => {
            const selectedPermissions = field.value || [];
            const togglePermission = (slug: string, checked: boolean) => {
              field.onChange(
                checked
                  ? [...selectedPermissions, slug]
                  : selectedPermissions.filter((p) => p !== slug),
              );
            };
            return (
              <FormItem className="flex flex-col min-h-80">
                <FormLabel aria-required>{t("permissions")}</FormLabel>
                <Card className="flex flex-col min-h-80">
                  <CardHeader className="flex flex-col">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 w-full">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={
                            permissions.length === 0 || permissionsLoading
                          }
                          onClick={() => {
                            field.onChange(permissions.map((p) => p.slug));
                            form.trigger("permissions");
                          }}
                        >
                          {t("select_all")}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={
                            permissions.length === 0 || permissionsLoading
                          }
                          onClick={() => {
                            field.onChange([]);
                            form.trigger("permissions");
                          }}
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
                      {permissions.map((permission) => {
                        const checked = field.value.includes(permission.slug);
                        return (
                          <div
                            key={permission.slug}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={permission.slug}
                              checked={checked}
                              onCheckedChange={(value) =>
                                togglePermission(
                                  permission.slug,
                                  Boolean(value),
                                )
                              }
                            />
                            <Label
                              htmlFor={permission.slug}
                              className="flex-1 cursor-pointer"
                            >
                              <div>
                                <div className="font-medium">
                                  {permission.name}
                                </div>
                                {permission.description && (
                                  <div className="text-sm text-gray-500">
                                    {permission.description}
                                  </div>
                                )}
                              </div>
                            </Label>
                          </div>
                        );
                      })}

                      {permissionsLoading ? (
                        <div className="text-center text-sm">
                          {t("loading")}
                        </div>
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
                <FormMessage />
              </FormItem>
            );
          }}
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
          <Button
            type="submit"
            disabled={isLoading || (isEditMode && !form.formState.isDirty)}
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
