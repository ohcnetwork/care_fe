import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import specimenDefinitionApi from "@/types/emr/specimenDefinition/specimenDefinitionApi";

import { SpecimenDefinitionForm } from "./SpecimenDefinitionForm";

interface UpdateSpecimenDefinitionProps {
  facilityId: string;
  specimenDefinitionId: string;
}

export function UpdateSpecimenDefinition({
  facilityId,
  specimenDefinitionId,
}: UpdateSpecimenDefinitionProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: specimenDefinition, isFetching } = useQuery({
    queryKey: ["specimen_definitions", facilityId, specimenDefinitionId],
    queryFn: query(specimenDefinitionApi.retrieveSpecimenDefinition, {
      pathParams: { facilityId, specimenDefinitionId },
    }),
  });

  const { mutate: updateSpecimenDefinition, isPending: isUpdating } =
    useMutation({
      mutationFn: mutate(specimenDefinitionApi.updateSpecimenDefinition, {
        pathParams: { facilityId, specimenDefinitionId },
      }),
      onSuccess: () => {
        toast.success(t("specimen_definition_updated"));
        queryClient.invalidateQueries({
          queryKey: ["specimen_definitions", facilityId],
        });
        queryClient.invalidateQueries({
          queryKey: ["specimen_definitions", facilityId, specimenDefinitionId],
        });
        navigate(`/specimen_definitions`);
      },
    });

  if (isFetching) {
    return <div>Loading...</div>;
  }

  if (!specimenDefinition) {
    return <div>{t("not_found")}</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">
        {t("update_specimen_definition")}
      </h1>
      <SpecimenDefinitionForm
        initialData={specimenDefinition}
        onSubmit={(data) =>
          updateSpecimenDefinition({
            ...data,
            patient_preparation:
              data.patient_preparation?.filter((item) => item && item.code) ||
              [],
          })
        }
        isLoading={isUpdating}
      />
    </div>
  );
}
