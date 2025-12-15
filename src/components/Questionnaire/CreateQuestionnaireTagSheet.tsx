import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import mutate from "@/Utils/request/mutate";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import { QuestionnaireTagModel } from "@/types/questionnaire/tags";

interface Props {
  trigger: React.ReactNode;
  onTagCreated: (tag: QuestionnaireTagModel) => void;
}

export default function CreateQuestionnaireTagSheet({
  trigger,
  onTagCreated,
}: Props) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagSlug, setNewTagSlug] = useState("");

  const { mutate: createTag, isPending: isCreating } = useMutation({
    mutationFn: mutate(questionnaireApi.tags.create),
    onSuccess: (data: unknown) => {
      const tagData = data as QuestionnaireTagModel;
      queryClient.invalidateQueries({
        queryKey: ["questionnaireTags"],
      });
      setNewTagName("");
      setNewTagSlug("");
      setOpen(false);
      onTagCreated?.(tagData);
      toast.success(t("tag_created_successfully"));
    },
  });

  const handleCreateTag = () => {
    if (!newTagName.trim() || !newTagSlug.trim()) {
      toast.error(t("name_and_slug_are_required"));
      return;
    }

    createTag({
      name: newTagName.trim(),
      slug: newTagSlug.trim(),
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="mr-2 size-4" />
            {t("create_tag")}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("create_tag")}</SheetTitle>
          <SheetDescription>{t("create_tag_description")}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">{t("tag_name")}</Label>
              <Input
                id="tag-name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder={t("enter_tag_name")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag-slug">{t("tag_slug")}</Label>
              <Input
                id="tag-slug"
                value={newTagSlug}
                onChange={(e) => setNewTagSlug(e.target.value)}
                placeholder={t("enter_tag_slug")}
              />
            </div>
            <Button
              onClick={handleCreateTag}
              disabled={isCreating || !newTagName || !newTagSlug}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t("creating")}
                </>
              ) : (
                t("create_tag")
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
