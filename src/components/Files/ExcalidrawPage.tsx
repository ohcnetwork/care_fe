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
import { CreateFileResponse } from "@/components/Patient/models";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

type Props = {
  associatingId: string;
  fileType: string;
  drawingId?: string;
};

export default function ExcalidrawPage({
  associatingId,
  drawingId,
  fileType,
}: Props) {
  const [elements, setElements] = useState<readonly ExcalidrawElement[] | null>(
    drawingId ? null : [],
  );
  const [name, setName] = useState("");
  const [id, setId] = useState(drawingId);
  const [isDirty, setIsDirty] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["file", id],
    queryFn: query(routes.retrieveUpload, {
      pathParams: { id: id || "" },
    }),
    enabled: !!id,
  });

  useEffect(() => {
    setIsDirty(!!elements?.length);
  }, [elements?.length]);

  useEffect(() => {
    if (!data) {
      return;
    }
    setName(data.name!);
    const fetchData = async () => {
      const response = await fetch(data.read_signed_url!);
      const json = await response.json();
      setElements(json.elements);
    };
    fetchData();
  }, [data]);
  const { mutateAsync: markUploadComplete, error: markUploadCompleteError } =
    useMutation({
      mutationFn: mutate(routes.markUploadCompleted, {
        pathParams: { id: id || "" },
      }),
    });

  const { mutateAsync: createUpload } = useMutation({
    mutationFn: mutate(routes.createUpload),
    onSuccess: (response: CreateFileResponse) => {
      setId(response.id);
    },
  });

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name for the drawing.");
      return;
    }

    const obj = {
      type: "excalidraw",
      version: "2",
      source: "https://care.ohc.network.com",
      elements: elements,
      appState: {},
      files: {},
    };

    try {
      const file = new File([JSON.stringify(obj)], `${name}.excalidraw`, {
        type: "text/plain",
      });
      let signedUrl = data?.read_signed_url || "";
      let response: CreateFileResponse | null = null;
      if (!id) {
        response = await createUpload({
          original_name: `${name}.excalidraw`,
          name: name,
          file_type: fileType,
          file_category: "unspecified",
          associating_id: associatingId,
          mime_type: "text/plain",
        });
        signedUrl = response.signed_url;
      }

      const formData = new FormData();
      formData.append("file", file);

      const upload = await fetch(signedUrl, {
        method: "PUT",
        body: file,
      });

      if (!upload.ok) {
        toast.error("Error uploading file");

        return;
      }
      await markUploadComplete({ id: response?.id });
      if (markUploadCompleteError) {
        toast.error(t("file_error__mark_complete_failed"));

        return;
      } else {
        toast.success(t("file_success__upload_complete"));
        navigate(`drawings/${response!.id}`);
      }
    } catch (error) {
      console.error("Error in Step 1 (createUpload):", error);
    }
  };

  if (isLoading || elements === null) {
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
              placeholder="Enter the File Name"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
        {isDirty && (
          <Button className="ml-auto" onClick={handleSave}>
            {t("save")}
          </Button>
        )}
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
          }}
          onChange={debounce(async (elements) => {
            setElements(elements);
          }, 100)}
        />
      </div>
    </div>
  );
}
