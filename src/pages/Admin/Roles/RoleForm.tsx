import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

  const [formData, setFormData] = React.useState({
    name: role?.name || "",
    description: role?.description || "",
    permissions: role?.permissions.map((p: Permission) => p.slug) || [],
  });

  const getQueryParams = (pageParam: number) => ({
    limit: String(PAGE_LIMIT),
    offset: String(pageParam),
  });

  const {
    data: permissionsList,
    fetchNextPage,
    hasNextPage,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ["permissions"],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query.debounced(permissionApi.listPermissions, {
        queryParams: getQueryParams(pageParam),
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
        ? prev.permissions.filter((p: string) => p !== permissionSlug)
        : [...prev.permissions, permissionSlug],
    }));
  };

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage();
  }, [inView, hasNextPage, fetchNextPage]);

  const isLoading =
    createRoleMutation.isPending || updateRoleMutation.isPending;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col space-y-6 max-h-[calc(100vh-7rem)]"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("name")}</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder={t("enter_role_name")}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t("description")}</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder={t("enter_role_description")}
            rows={3}
          />
        </div>
      </div>

      <Card className="flex flex-col min-h-80">
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
        <CardContent className="overflow-auto">
          <div className="space-y-3 h-full pr-2">
            {permissions.map((permission, index) => (
              <div
                key={permission.slug}
                className="flex items-center space-x-2"
                ref={index == permissions.length - 1 ? ref : undefined}
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
            {isFetching && (
              <div className="text-center text-sm">{t("loading")}</div>
            )}
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
