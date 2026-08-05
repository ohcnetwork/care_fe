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

/** Who the created valueset belongs to. The backend only lets superusers
 *  create in the `instance` context, so any mount reachable from a
 *  facility-scoped surface must pass its own context or every create 403s. */
export type ValueSetCreateContext = Pick<
  ValueSetCreate,
  "auth_context" | "facility" | "facility_organization"
>;

const INSTANCE_CONTEXT: ValueSetCreateContext = { auth_context: "instance" };

interface ValueSetEditorProps {
  id?: string; // If provided, we're editing an existing valueset
  createContext?: ValueSetCreateContext;
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

export function ValueSetEditor({
  id,
  createContext = INSTANCE_CONTEXT,
  onSuccess,
}: ValueSetEditorProps) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  // Fetch existing valueset if we're editing
  const { data: existingValueset, isLoading } = useQuery({
    queryKey: ["valueset", id],
    queryFn: query(valueSetApi.get, {
      pathParams: { id: id! },
    }),
    enabled: !!id,
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
      pathParams: { id: id! },
    }),
    onSuccess: (data: ValueSetRead) => {
      toast.success(t("valueset_updated"));
      queryClient.removeQueries({ queryKey: ["valueset", id] });
      onSuccess?.(data);
      navigate(`/admin/valuesets`);
    },
  });

  const handleSubmit = (data: ValueSetBase) => {
    const payload = normalizeValueSetPayload(data);

    if (id && existingValueset) {
      const updateData: ValueSetUpdate = {
        ...payload,
        id: existingValueset.id,
      };
      updateMutation.mutate(updateData);
    } else {
      const createData: ValueSetCreate = {
        ...payload,
        ...createContext,
        inherited: false,
      };
      createMutation.mutate(createData);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {id
          ? existingValueset?.is_system_defined
            ? t("preview_value_set")
            : t("edit_value_set")
          : t("create_new_value_set")}
      </h1>

      {id && isLoading ? (
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
