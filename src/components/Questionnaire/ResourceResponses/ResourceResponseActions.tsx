import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";

import mutate from "@/Utils/request/mutate";
import { QuestionnaireResponseStatus } from "@/types/questionnaire/questionnaireResponse";
import resourceQuestionnaireResponseApi, {
  ResourceQuestionnaireResponse,
} from "@/types/questionnaire/resourceQuestionnaireResponseApi";

export function ResourceResponseActions({
  response,
}: {
  response: ResourceQuestionnaireResponse;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: mutate(resourceQuestionnaireResponseApi.update, {
      pathParams: { id: response.id },
    }),
    onSuccess: () => {
      toast.success(t("questionnaire_response_marked_as_entered_in_error"));
      void queryClient.invalidateQueries({ queryKey: ["resourceResponses"] });
      setOpen(false);
    },
  });

  // As with patient response actions, the server enforces the user's
  // submission permission and the configured correction time window.
  if (response.status === QuestionnaireResponseStatus.EnteredInError) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="h-auto min-h-10 whitespace-normal text-red-700 hover:text-red-800"
        disabled={isPending}
        onClick={() => setOpen(true)}
      >
        <Ban className="size-4 shrink-0" />
        {t("mark_as_entered_in_error")}
      </Button>
      <ConfirmActionDialog
        open={open}
        onOpenChange={setOpen}
        title={t("mark_as_entered_in_error")}
        description={t("questionnaire_response_entered_in_error_warning")}
        onConfirm={() =>
          updateStatus({ status: QuestionnaireResponseStatus.EnteredInError })
        }
        confirmText={t("confirm")}
        variant="destructive"
        disabled={isPending}
      />
    </>
  );
}
