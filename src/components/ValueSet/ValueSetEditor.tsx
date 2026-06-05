import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import {
  ValueSetBase,
  ValueSetCreate,
  ValueSetRead,
  ValueSetUpdate,
} from "@/types/valueSet/valueSet";
import valueSetApi from "@/types/valueSet/valueSetApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

import { ValueSetForm } from "./ValueSetForm";

interface ValueSetEditorProps {
  slug?: string; // If provided, we're editing an existing valueset
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

export function ValueSetEditor({ slug, onSuccess }: ValueSetEditorProps) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  // Fetch existing valueset if we're editing
  const { data: existingValueset, isLoading } = useQuery({
    queryKey: ["valueset", slug],
    queryFn: query(valueSetApi.get, {
      pathParams: { slug: slug! },
    }),
    enabled: !!slug,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: mutate(valueSetApi.create),
    onSuccess: (data: ValueSetRead) => {
      toast.success(t("valueset_created"));
      queryClient.invalidateQueries({ queryKey: ["valuesets"] });
      onSuccess?.(data);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: mutate(valueSetApi.update, {
      pathParams: { slug: slug! },
    }),
    onSuccess: (data: ValueSetRead) => {
      toast.success(t("valueset_updated"));
      queryClient.removeQueries({ queryKey: ["valueset", slug] });
      onSuccess?.(data);
      navigate(`/admin/valuesets`);
    },
  });

  const handleSubmit = (data: ValueSetBase) => {
    const payload = normalizeValueSetPayload(data);

    if (slug && existingValueset) {
      const updateData: ValueSetUpdate = {
        ...payload,
        id: existingValueset.id,
      };
      updateMutation.mutate(updateData);
    } else {
      const createData: ValueSetCreate = payload;
      createMutation.mutate(createData);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {slug
          ? existingValueset?.is_system_defined
            ? t("preview_value_set")
            : t("edit_value_set")
          : t("create_new_value_set")}
      </h1>

      {slug && isLoading ? (
        <FormSkeleton rows={10} />
      ) : (
        <ValueSetForm
          initialData={existingValueset}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}
