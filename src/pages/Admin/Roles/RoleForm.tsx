import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { Permission } from "@/types/emr/permission/permission";
import permissionApi from "@/types/emr/permission/permissionApi";
import {
  DEFAULT_ROLE_CONTEXTS,
  RoleContext,
  RoleRead,
  getRoleContextLabelKey,
} from "@/types/emr/role/role";
import roleApi from "@/types/emr/role/roleApi";

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
    contexts: z
      .array(z.nativeEnum(RoleContext))
      .min(1, t("at_least_one_context_required")),
    permissions: z
      .array(z.string())
      .min(1, t("at_least_one_permission_required")),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
      contexts: [...(role?.contexts || DEFAULT_ROLE_CONTEXTS)],
      permissions: role?.permissions.map((p: Permission) => p.slug) || [],
    },
  });

  useEffect(() => {
    form.reset({
      name: role?.name || "",
      description: role?.description || "",
      contexts: [...(role?.contexts || DEFAULT_ROLE_CONTEXTS)],
      permissions: role?.permissions.map((p: Permission) => p.slug) || [],
    });
  }, [form, role]);

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
      description: values.description || "",
      contexts: values.contexts,
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
        className="flex flex-col space-y-5 max-h-[calc(100vh-7rem)]"
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
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contexts"
          render={({ field }) => {
            const selectedContexts = field.value || [];

            const toggleContext = (context: RoleContext, checked: boolean) => {
              field.onChange(
                checked
                  ? [...selectedContexts, context]
                  : selectedContexts.filter((value) => value !== context),
              );
            };

            return (
              <FormItem>
                <FormLabel aria-required>{t("contexts")}</FormLabel>
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <p className="mb-2.5 text-xs text-gray-500">
                    {t("select_context")}
                  </p>
                  <div className="space-y-2">
                    {Object.values(RoleContext).map((context) => {
                      const isChecked = selectedContexts.includes(context);
                      return (
                        <label
                          key={context}
                          htmlFor={`context-${context}`}
                          className={cn(
                            "flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 transition-colors",
                            isChecked
                              ? "border-primary-200 bg-primary-50/50"
                              : "border-gray-200 hover:bg-gray-50",
                          )}
                        >
                          <Checkbox
                            id={`context-${context}`}
                            checked={isChecked}
                            onCheckedChange={(value) =>
                              toggleContext(context, Boolean(value))
                            }
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {t(getRoleContextLabelKey(context))}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            );
          }}
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
                <div className="flex items-center justify-between">
                  <FormLabel aria-required>{t("permissions")}</FormLabel>
                  <span className="text-xs text-gray-400">
                    {selectedPermissions.length} {t("selected")}
                  </span>
                </div>
                <div className="flex flex-col min-h-80 rounded-lg border border-gray-200 bg-white">
                  <div className="space-y-2 border-b border-gray-100 p-3">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
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
                        className="flex-1 text-xs"
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

                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder={t("search_permissions")}
                        value={searchPermission}
                        onChange={(e) => setSearchPermission(e.target.value)}
                        className="h-8 pl-8 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto p-2">
                    <div className="space-y-1">
                      {permissions.map((permission) => {
                        const checked = field.value.includes(permission.slug);
                        return (
                          <label
                            key={permission.slug}
                            htmlFor={permission.slug}
                            className={cn(
                              "flex cursor-pointer items-start gap-2.5 rounded-md px-2.5 py-2 transition-colors",
                              checked ? "bg-primary-50/50" : "hover:bg-gray-50",
                            )}
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
                              className="mt-0.5"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-700">
                                {permission.name}
                              </div>
                              {permission.description && (
                                <div className="text-xs text-gray-400">
                                  {permission.description}
                                </div>
                              )}
                            </div>
                            {checked && (
                              <Check className="mt-0.5 size-3.5 shrink-0 text-primary-600" />
                            )}
                          </label>
                        );
                      })}

                      {permissionsLoading ? (
                        <div className="py-4 text-center text-sm text-gray-400">
                          {t("loading")}
                        </div>
                      ) : (
                        permissions.length === 0 && (
                          <div className="py-4 text-center text-sm text-gray-400">
                            {t("no_matching_permissions")}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <div className="flex justify-end gap-2 pt-1">
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
