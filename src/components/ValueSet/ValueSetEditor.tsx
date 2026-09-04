import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { navigate, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";

import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import {
  ValueSetBase,
  ValueSetCreate,
  ValueSetRead,
  ValueSetScope,
  ValueSetUpdate,
  scopeCreateContext,
} from "@/types/valueSet/valueSet";
import valueSetApi from "@/types/valueSet/valueSetApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

import { useCanWriteValueSet } from "./useCanWriteValueSet";
import { ValueSetForm, ValueSetFormSubmit } from "./ValueSetForm";
import { ValueSetOrganizationsField } from "./ValueSetOrganizationsField";

interface ValueSetEditorProps {
  id?: string; // If provided, we're editing an existing valueset
  scope: ValueSetScope;
  /** Overrides the default post-save navigation (an inline sheet closes
   *  itself instead of leaving the page). */
  onSuccess?: (data: ValueSetRead) => void;
}

function normalizeValueSetPayload(data: ValueSetBase): ValueSetBase {
  return {
    ...data,
    compose: {
      include: data.compose.include.map((rule) => ({
        ...rule,
        version: rule.version?.trim() || null,
      })),
      exclude: data.compose.exclude.map((rule) => ({
        ...rule,
        version: rule.version?.trim() || null,
      })),
    },
  };
}

export function ValueSetEditor({ id, scope, onSuccess }: ValueSetEditorProps) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  // Hold the form until permissions are known — otherwise a facility mount
  // renders editable, then snaps to read-only when the facility resolves.
  const { canWrite, isLoading: isPermissionLoading } =
    useCanWriteValueSet(scope);
  // `?parent=` is how the list's Customize action seeds a new facility set.
  const [{ parent: initialParentId }] = useQueryParams<{ parent?: string }>();

  // Fetch existing valueset if we're editing
  const { data: existingValueset, isLoading } = useQuery({
    queryKey: ["valueset", id],
    queryFn: query(valueSetApi.get, {
      pathParams: { id: id! },
    }),
    enabled: !!id,
  });

  const { data: initialParent, isLoading: isLoadingParent } = useQuery({
    queryKey: ["valueset", initialParentId],
    queryFn: query(valueSetApi.get, {
      pathParams: { id: initialParentId ?? "" },
    }),
    enabled: !id && !!initialParentId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: mutate(valueSetApi.create),
    onSuccess: (data: ValueSetRead) => {
      toast.success(t("valueset_created"));
      queryClient.invalidateQueries({ queryKey: ["valuesets"] });
      if (onSuccess) {
        onSuccess(data);
        return;
      }
      // A facility set is invisible to everyone but superusers until it has
      // departments, and those are edited on the edit page — land there.
      navigate(
        scope.authContext === "facility"
          ? `${scope.basePath}/${data.id}/edit`
          : scope.basePath,
      );
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: mutate(valueSetApi.update, {
      pathParams: { id: id! },
    }),
    onSuccess: (data: ValueSetRead) => {
      toast.success(t("valueset_updated"));
      queryClient.removeQueries({ queryKey: ["valueset", id] });
      queryClient.invalidateQueries({ queryKey: ["valuesets"] });
      if (onSuccess) {
        onSuccess(data);
        return;
      }
      navigate(scope.basePath);
    },
  });

  const handleSubmit = ({ parent, inherited, ...data }: ValueSetFormSubmit) => {
    const payload = normalizeValueSetPayload(data);

    if (id) {
      // Keyed on `id`, not on the fetched object: a failed GET must not
      // turn an edit into a create, which would file a duplicate set.
      if (!existingValueset) {
        return;
      }
      const updateData: ValueSetUpdate = {
        ...payload,
        id: existingValueset.id,
      };
      updateMutation.mutate(updateData);
    } else {
      const createData: ValueSetCreate = {
        ...payload,
        ...scopeCreateContext(scope),
        parent,
        inherited,
      };
      createMutation.mutate(createData);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        {id
          ? existingValueset?.is_system_defined
            ? t("preview_value_set")
            : t("edit_value_set")
          : t("create_new_value_set")}
      </h1>

      {id && scope.authContext === "facility" && (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <ValueSetOrganizationsField
              facilityId={scope.facilityId}
              valuesetId={id}
              canWrite={canWrite}
            />
          </CardContent>
        </Card>
      )}

      {(id && isLoading) ||
      (initialParentId && isLoadingParent) ||
      isPermissionLoading ? (
        <FormSkeleton rows={10} />
      ) : (
        <ValueSetForm
          scope={scope}
          initialData={existingValueset}
          initialParent={initialParent}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          isReadOnly={!canWrite}
        />
      )}
    </div>
  );
}
