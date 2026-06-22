import { usePluginDrawingApplication } from "@/components/Files/Drawings/usePluginDrawingApplications";
import { MetaArtifactRead } from "@/types/metaArtifact/metaArtifact";
import { LoaderCircleIcon } from "lucide-react";
import { Suspense } from "react";

export interface DrawingPreviewProps {
  obj: MetaArtifactRead;
}

const FallbackSkeleton = () => (
  <div className="flex bg-gray-50 size-full items-center justify-center">
    <LoaderCircleIcon className="animate-spin" size={24} />
  </div>
);

export const DrawingPreview: React.FC<DrawingPreviewProps> = ({ obj }) => {
  const { drawingApplication, isLoading } = usePluginDrawingApplication(
    obj.object_value.application,
  );

  if (isLoading) {
    return <FallbackSkeleton />;
  }

  return (
    <Suspense fallback={<FallbackSkeleton />}>
      <drawingApplication.previewer obj={obj} />
    </Suspense>
  );
};
