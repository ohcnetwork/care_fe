import { Excalidraw } from "@excalidraw/excalidraw";
import { type ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Input } from "@/components/ui/input";

import Loading from "@/components/Common/Loading";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";

type Props = {
  drawingId?: string;
};

export default function ExcalidrawView({ drawingId }: Props) {
  const [elements, setElements] = useState<readonly ExcalidrawElement[] | null>(
    drawingId ? null : [],
  );
  const [name, setName] = useState("");
  const [id] = useState(drawingId);

  const { data, isLoading } = useQuery({
    queryKey: ["file", id],
    queryFn: query(routes.retrieveUpload, {
      pathParams: { id: id || "" },
    }),
    enabled: !!id,
  });

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
            <Input type="text" value={name} />
          </div>
        </div>
      </div>

      <div className="flex-grow h-[calc(100vh-10rem)] -m-2">
        <Excalidraw
          viewModeEnabled={true}
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
        />
      </div>
    </div>
  );
}
