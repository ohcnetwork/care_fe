import { Excalidraw } from "@excalidraw/excalidraw";
import { type ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import {
  hashKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { t } from "i18next";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { debounce } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import Loading from "@/components/Common/Loading";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import metaArtifactApi from "@/types/metaAritifact/metaArtifactApi";

type Props = {
  associatingId: string;
  drawingId?: string;
  associating_type: "patient" | "encounter";
};

export default function ExcalidrawEditor({
  associatingId,
  associating_type,
  drawingId,
}: Props) {
  const queryClient = useQueryClient();
  const [elements, setElements] = useState<readonly ExcalidrawElement[] | null>(
    drawingId ? null : [],
  );
  const [name, setName] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const { mutate: saveDrawing } = useMutation({
    mutationFn: mutate(metaArtifactApi.upsert),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["drawing", drawingId, associatingId],
      });
      navigate("../drawings");
    },
  });

  const { data, isFetching } = useQuery({
    queryKey: ["drawing", drawingId, associatingId],
    queryFn: query(metaArtifactApi.retrieve, {
      pathParams: { external_id: drawingId || "" },
    }),
    enabled: !!drawingId,
  });

  useEffect(() => {
    if (!data) {
      return;
    }
    setName(data.name);
    setElements(data.object_value.elements);
    setIsDirty(false);
  }, [data]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t("please_enter_a_name_for_the_drawing"));
      return;
    }
    try {
      saveDrawing({
        datapoints: [
          {
            id: drawingId,
            associating_type: associating_type,
            associating_id: associatingId,
            name: name,
            object_type: "drawing",
            object_value: {
              application: "excalidraw",
              elements: elements || [],
            },
          },
        ],
      });
      toast.success(t("drawing_saved_successfully"));
    } catch (_error) {
      toast.error(t("error_saving_file"));
    }
  };

  const handleBack = () => {
    if (isDirty) {
      setIsAlertOpen(true);
    } else {
      navigate("../drawings");
    }
  };

  const handleSaveAndGoBack = async () => {
    await handleSave();
    setIsAlertOpen(false);
  };

  if (elements === null || isFetching) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -mt-8 -mr-2">
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("unsaved_changes")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("you_have_unsaved_changes_what_would_you_like_to_do")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-gray-50 shadow-xs hover:bg-red-500/90"
              onClick={() => {
                setIsAlertOpen(false);
                navigate("../drawings");
              }}
            >
              {t("discard_changes")}
            </AlertDialogAction>
            <AlertDialogAction onClick={handleSaveAndGoBack}>
              {t("save_and_go_back")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-row items-center justify-between ml-0 mx-2 my-3">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <CareIcon icon="l-arrow-left" />
          {t("back")}
        </Button>
        {!drawingId ? (
          <Input
            type="text"
            className="max-w-xs text-center"
            value={name}
            placeholder={t("enter_drawing_name")}
            onChange={(e) => setName(e.target.value)}
          />
        ) : (
          <h1 className="text-base font-semibold">{name}</h1>
        )}
        <Button
          variant="white"
          size="sm"
          onClick={handleSave}
          disabled={!isDirty}
        >
          <CareIcon icon="l-save" className="text-base hidden sm:block" />
          {t("save")}
        </Button>
      </div>

      <div className="h-full w-full -m-2">
        <Excalidraw
          UIOptions={{
            canvasActions: {
              saveAsImage: true,
              export: false,
              loadScene: false,
            },
          }}
          initialData={{
            appState: { theme: "light" },
            elements: elements,
          }}
          onChange={debounce((newElements) => {
            setElements(newElements);
            if (!isDirty && hashKey(newElements) !== hashKey(elements)) {
              setIsDirty(true);
            }
          }, 100)}
        />
      </div>
    </div>
  );
}
