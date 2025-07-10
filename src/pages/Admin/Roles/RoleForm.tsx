import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";

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
  const [formData, setFormData] = React.useState({
    name: role?.name || "",
    description: role?.description || "",
    permissions: role?.permissions.map((p) => p.slug) || [],
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description,
      permissions: formData.permissions,
    };

    if (role?.id) {
      updateRoleMutation.mutate(payload);
    } else {
      createRoleMutation.mutate(payload);
    }
  };

  const handlePermissionToggle = (permissionSlug: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionSlug)
        ? prev.permissions.filter((p) => p !== permissionSlug)
        : [...prev.permissions, permissionSlug],
    }));
  };

  const isLoading =
    createRoleMutation.isPending || updateRoleMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">{t("name")}</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder={t("enter") + " " + t("role") + " " + t("name")}
            required
          />
        </div>

        <div>
          <Label htmlFor="description">{t("description")}</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder={t("enter") + " " + t("role") + " " + t("description")}
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
                  setFormData((prev) => ({
                    ...prev,
                    permissions: permissions.map((p) => p.slug),
                  }))
                }
              >
                {t("select_all")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    permissions: [],
                  }))
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
                  checked={formData.permissions.includes(permission.slug)}
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
