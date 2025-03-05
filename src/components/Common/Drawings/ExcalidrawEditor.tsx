import { Excalidraw } from "@excalidraw/excalidraw";
import { type ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { debounce } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

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
  const [elements, setElements] = useState<readonly ExcalidrawElement[] | null>(
    drawingId ? null : [],
  );
  const [name, setName] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setIsDirty(!!elements?.length);
  }, [elements?.length]);

  const { mutate: saveDrawing } = useMutation({
    mutationFn: mutate(metaArtifactApi.upsert),
    onSuccess: () => navigate("../drawings"),
  });

  const { data } = useQuery({
    queryKey: ["drawingId", drawingId, associatingId],
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

  if (elements === null) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex flex-row justify-between items-center p-2">
        <div className="flex flex-row items-center">
          <div className="rounded-full bg-primary-100 px-5 py-4">
            <CareIcon icon="l-pen" className="text-lg text-primary-500" />
          </div>
          <div className="m-4">
            <Input
              type="text"
              value={name}
              placeholder={t("enter_the_file_name")}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
        <Button
          variant="white"
          className="ml-auto"
          onClick={handleSave}
          disabled={!isDirty}
        >
          <CareIcon icon="l-save" className="text-lg hidden sm:block" />
          {t("save")}
        </Button>
      </div>

      <div className="flex-grow h-[calc(100vh-10rem)] -m-2">
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
          onChange={debounce((elements) => setElements(elements), 100)}
        />
      </div>
    </div>
  );
}
