import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import mutate from "@/Utils/request/mutate";
import { Permission } from "@/types/emr/permission/permission";
import { Role } from "@/types/emr/role/role";
import roleApi from "@/types/emr/role/roleApi";

const RoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, "Select at least one permission"),
});

type RoleFormValues = z.infer<typeof RoleSchema>;

interface RoleFormProps {
  role: Role | null;
  permissions: Permission[];
  onSuccess: () => void;
}

export default function RoleForm({
  role,
  permissions,
  onSuccess,
}: RoleFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(RoleSchema),
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
      permissions: role?.permissions.map((p) => p.slug) || [],
    },
  });

  const selectedPermissions = watch("permissions");

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

  const onSubmit = (data: RoleFormValues) => {
    if (role?.id) {
      updateRoleMutation.mutate(data);
    } else {
      createRoleMutation.mutate(data);
    }
  };

  const handlePermissionToggle = (slug: string) => {
    const updated = selectedPermissions.includes(slug)
      ? selectedPermissions.filter((p) => p !== slug)
      : [...selectedPermissions, slug];
    setValue("permissions", updated, { shouldValidate: true });
  };

  const isLoading =
    createRoleMutation.isPending || updateRoleMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("name")}</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder={t("enter_role_name")}
            required
          />
          {errors.name && (
            <div className="text-red-500 text-sm">{errors.name.message}</div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t("description")}</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder={t("enter_role_description")}
            rows={3}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("permissions")}</CardTitle>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setValue(
                    "permissions",
                    permissions.map((p) => p.slug),
                    { shouldValidate: true },
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
                  setValue("permissions", [], { shouldValidate: true })
                }
              >
                {t("clear")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {permissions.map((permission) => (
              <div
                key={permission.slug}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  id={permission.slug}
                  checked={selectedPermissions.includes(permission.slug)}
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
          </div>
          {errors.permissions && (
            <div className="text-red-500 text-sm mt-2">
              {errors.permissions.message}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
          disabled={isLoading}
        >
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? t("saving")
            : role?.id
              ? t("update_role")
              : t("create_role")}
        </Button>
      </div>
    </form>
  );
}
