import { useEffect, useState } from "react";

type UseMediaStreamProps = {
  open: boolean;
  cameraFacingMode: string;
  onOpenChange: (isOpen: boolean) => void;
  requestPermission: (
    facingMode: string,
  ) => Promise<{ hasPermission: boolean; mediaStream?: MediaStream | null }>;
};

export const useMediaStream = ({
  open,
  cameraFacingMode,
  onOpenChange,
  requestPermission,
}: UseMediaStreamProps) => {
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let localStream: MediaStream | null = null;
    const getCameraStream = async () => {
      const hasPermission = await requestPermission(cameraFacingMode);
      if (!hasPermission.hasPermission) {
        onOpenChange(false);
        return;
      }

      try {
        const mediaStream = hasPermission.mediaStream!;
        localStream = mediaStream;
        setStream(mediaStream);
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    };

    if (open) {
      getCameraStream();
    }
    return () => {
      console.log("stopping");
      if (open && localStream) {
        console.log("inside local stopping");
        localStream.getTracks().forEach((track) => track.stop());
      }
      console.log(stream);
      if (open && stream) {
        console.log("inside stopping");
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    };
  }, [open, cameraFacingMode]);
};
