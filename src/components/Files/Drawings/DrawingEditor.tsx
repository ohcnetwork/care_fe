import ErrorBoundary from "@/components/Common/ErrorBoundary";
import Loading from "@/components/Common/Loading";
import { usePluginDrawingApplication } from "@/components/Files/Drawings/usePluginDrawingApplications";
import {
  DrawingObjectValue,
  MetaArtifactObjectType,
  MetaArtifactRead,
} from "@/types/metaArtifact/metaArtifact";
import metaArtifactApi from "@/types/metaArtifact/metaArtifactApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { goBack } from "@/Utils/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export interface DrawingEditorApplicationProps {
  obj: MetaArtifactRead;
  value: DrawingObjectValue;
  onChange: (value: DrawingObjectValue) => void;
  handleSave?: () => void;
  handleExit?: () => void;
  disabled?: boolean;
}

interface Props {
  id: string;
}

export const DrawingEditor: React.FC<Props> = ({ id }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [value, setValue] = useState<DrawingObjectValue>();

  const { data, isFetching: isFetchingDrawing } = useQuery({
    queryKey: ["drawing", id],
    queryFn: query(metaArtifactApi.retrieve, {
      pathParams: { external_id: id },
    }),
  });

  const { mutate: saveDrawing, isPending: isSaving } = useMutation({
    mutationFn: mutate(metaArtifactApi.update, {
      pathParams: { external_id: id },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["drawing", id],
      });
    },
  });

  const isLoading = isFetchingDrawing || !data || !value;

  useEffect(() => {
    if (data && value == null) {
      setValue(data.object_value);
    }
  }, [data, value]);

  if (isLoading) {
    return <Loading />;
  }

  const handleChange = (value: DrawingObjectValue) => {
    setValue(value);
  };

  const handleSave = () => {
    saveDrawing(
      {
        name: data.name,
        object_type: MetaArtifactObjectType.DRAWING,
        object_value: value,
        note: data.note,
      },
      {
        onSuccess: () => {
          toast.success(t("saved"), { duration: 700 });
          goBack();
        },
      },
    );
  };

  return (
    <div className="h-[calc(100vh-1.4rem)] w-[calc(100%+1.25rem)] -mt-6.5 -ml-2.5 -mb-2.5 rounded-md overflow-clip">
      <ErrorBoundary
        fallback={
          <div className="flex items-center justify-center size-full">
            <p className="text-sm text-gray-500">
              {t("unsupported_drawing_application", {
                application: data.object_value.application,
              })}
            </p>
          </div>
        }
      >
        <DrawingEditorApplication
          obj={data}
          value={value}
          onChange={handleChange}
          handleSave={handleSave}
          handleExit={() => goBack()}
          disabled={isSaving}
        />
      </ErrorBoundary>
    </div>
  );
};

const DrawingEditorApplication = (props: DrawingEditorApplicationProps) => {
  const { drawingApplication, isLoading } = usePluginDrawingApplication(
    props.obj.object_value.application,
  );

  if (isLoading) {
    return <Loading />;
  }

  const Editor = drawingApplication.editor;

  return (
    <Suspense fallback={<Loading />}>
      <Editor {...props} />
    </Suspense>
  );
};
