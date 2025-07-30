import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

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

  const roleSchema = z.object({
    name: z.string().trim().min(1, t("name_is_required")),
    description: z.string().trim().optional(),
    permissions: z
      .array(z.string())
      .min(1, t("at_least_one_permission_required")),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
      permissions: role?.permissions.map((p) => p.slug) || [],
    },
  });

  const watchedPermissions = watch("permissions");

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

  const onSubmit = (data: z.infer<typeof roleSchema>) => {
    const payload = {
      name: data.name,
      description: data.description,
      permissions: data.permissions,
    };

    if (role?.id) {
      updateRoleMutation.mutate(payload);
    } else {
      createRoleMutation.mutate(payload);
    }
  };

  const isLoading =
    createRoleMutation.isPending || updateRoleMutation.isPending;

  const handlePermissionToggle = (slug: string) => {
    const current = watch("permissions") || [];
    if (current.includes(slug)) {
      setValue(
        "permissions",
        current.filter((s) => s !== slug),
      );
    } else {
      setValue("permissions", [...current, slug]);
    }
  };

  const handleSelectAll = () => {
    setValue(
      "permissions",
      permissions.map((p) => p.slug),
    );
  };

  const handleClearAll = () => {
    setValue("permissions", []);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("name")}</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder={t("enter_role_name")}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
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
                  checked={watchedPermissions?.includes(permission.slug)}
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
            <p className="text-sm text-red-500">{errors.permissions.message}</p>
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
