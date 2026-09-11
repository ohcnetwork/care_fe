import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { navigate, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

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
import {
  ValueSetForm,
  ValueSetFormSubmit,
  type ValueSetFormState,
} from "./ValueSetForm";
import { ValueSetOrganizationsField } from "./ValueSetOrganizationsField";

interface ValueSetEditorProps {
  id?: string; // If provided, we're editing an existing valueset
  scope: ValueSetScope;
  /** Overrides the default post-save navigation (an inline sheet closes
   *  itself instead of leaving the page). */
  onSuccess?: (data: ValueSetRead) => void;
  /** Lets an embedded editor close its host instead of navigating away. */
  onCancel?: () => void;
  /** Reports whether closing the host could discard an edit or active save. */
  onStateChange?: (state: ValueSetFormState) => void;
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

export function ValueSetEditor({
  id,
  scope,
  onSuccess,
  onCancel,
  onStateChange,
}: ValueSetEditorProps) {
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
        // Slugs are stable references, not editable metadata. Preserve the
        // fetched identifier even if form state is changed programmatically.
        slug: existingValueset.slug,
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
    <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
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
          onCancel={onCancel}
          onStateChange={onStateChange}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          isReadOnly={!canWrite}
          accessControl={
            id && scope.authContext === "facility" ? (
              <ValueSetOrganizationsField
                facilityId={scope.facilityId}
                valuesetId={id}
                canWrite={canWrite}
              />
            ) : undefined
          }
        />
      )}
    </div>
  );
}
