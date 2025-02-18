import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "raviger";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  CreateValuesetModel,
  UpdateValuesetModel,
  ValuesetBase,
  ValuesetFormType,
} from "@/types/valueset/valueset";
import valuesetApi from "@/types/valueset/valuesetApi";

import { ValueSetForm } from "./ValueSetForm";

interface ValueSetEditorProps {
  slug?: string; // If provided, we're editing an existing valueset
}

function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    </div>
  );
}

export function ValueSetEditor({ slug }: ValueSetEditorProps) {
  const navigate = useNavigate();

  // Fetch existing valueset if we're editing
  const { data: existingValueset, isLoading } = useQuery({
    queryKey: ["valueset", slug],
    queryFn: query(valuesetApi.get, {
      pathParams: { slug: slug! },
    }),
    enabled: !!slug,
  }) as { data: ValuesetBase | undefined; isLoading: boolean };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: mutate<typeof valuesetApi.create>(valuesetApi.create),
    onSuccess: (data: ValuesetBase) => {
      toast.success("ValueSet created successfully");
      navigate(`/valuesets/${data.slug}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: mutate(valuesetApi.update, {
      pathParams: { slug: slug! },
    }),
    onSuccess: () => {
      toast.success("ValueSet updated successfully");
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
        {slug ? "Edit ValueSet" : "Create New ValueSet"}
      </h1>

      {slug && isLoading ? (
        <FormSkeleton />
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
