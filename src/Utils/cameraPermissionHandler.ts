import { useCallback, useState } from "react";
import { toast } from "sonner";

export const handleCameraPermission = () => {
  const [toastShown, setToastShown] = useState(false);

  const requestPermission = useCallback(
    async (device: "camera", cameraFacingMode: string = "user") => {
      try {
        setToastShown(false);
        const constraints =
          device === "camera"
            ? { video: { facingMode: cameraFacingMode } }
            : { audio: true };

        await navigator.mediaDevices.getUserMedia(constraints);
        return true;
      } catch (_error) {
        if (!toastShown) {
          setToastShown(true);
          toast.warning(`${device} permission denied`);
        }
        return false;
      }
    },
    [toastShown],
  );

  return { requestPermission };
};
