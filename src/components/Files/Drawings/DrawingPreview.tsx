import { usePluginDrawingApplication } from "@/components/Files/Drawings/usePluginDrawingApplications";
import { Skeleton } from "@/components/ui/skeleton";
import { MetaArtifactRead } from "@/types/metaArtifact/metaArtifact";

export interface DrawingPreviewProps {
  obj: MetaArtifactRead;
}

export const DrawingPreview: React.FC<DrawingPreviewProps> = ({ obj }) => {
  const { drawingApplication, isLoading } = usePluginDrawingApplication(
    obj.object_value.application,
  );

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  return <drawingApplication.previewer obj={obj} />;
};
