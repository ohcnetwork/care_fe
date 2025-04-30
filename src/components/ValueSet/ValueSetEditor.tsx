import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  CreateValuesetModel,
  UpdateValuesetModel,
  ValuesetFormType,
} from "@/types/valueset/valueset";
import valuesetApi from "@/types/valueset/valuesetApi";

import { ValueSetForm } from "./ValueSetForm";

interface ValueSetEditorProps {
  slug?: string; // If provided, we're editing an existing valueset
}

export function ValueSetEditor({ slug }: ValueSetEditorProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  // Fetch existing valueset if we're editing
  const { data: existingValueset, isLoading } = useQuery({
    queryKey: ["valueset", slug],
    queryFn: query(valuesetApi.get, {
      pathParams: { slug: slug! },
    }),
    enabled: !!slug,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: mutate(valuesetApi.create),
    onSuccess: () => {
      toast.success("ValueSet created successfully");
      navigate(`/admin/valuesets`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: mutate(valuesetApi.update, {
      pathParams: { slug: slug! },
    }),
    onSuccess: () => {
      toast.success("ValueSet updated successfully");
      queryClient.removeQueries({ queryKey: ["valueset", slug] });
      navigate(`/admin/valuesets`);
    },
  });

  const handleSubmit = (data: ValuesetFormType) => {
    if (slug && existingValueset) {
      const updateData: UpdateValuesetModel = {
        ...data,
        id: existingValueset.id,
      };
      updateMutation.mutate(updateData);
    } else {
      const createData: CreateValuesetModel = data;
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
          isSystemDefined={existingValueset?.is_system_defined}
        />
      )}
    </div>
  );
}
