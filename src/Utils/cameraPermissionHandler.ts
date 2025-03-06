import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export const handleCameraPermission = () => {
  const toastShownRef = useRef(false);
  const { t } = useTranslation();

  const requestPermission = useCallback(
    async (device: "camera", cameraFacingMode: string = "user") => {
      try {
        toastShownRef.current = false;
        const constraints =
          device === "camera"
            ? { video: { facingMode: cameraFacingMode } }
            : { audio: true };

        await navigator.mediaDevices.getUserMedia(constraints);
        return true;
      } catch (_error) {
        if (!toastShownRef.current) {
          toastShownRef.current = true;
          toast.warning(t("camera_permission_denied"));
        }
        return false;
      }
    },
    [],
  );

  return { requestPermission };
};
