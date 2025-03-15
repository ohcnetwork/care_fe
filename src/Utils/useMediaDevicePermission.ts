import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export const useMediaDevicePermission = () => {
  const toastShownRef = useRef(false);
  const { t } = useTranslation();

  const requestPermission = useCallback(
    async (cameraFacingMode: string = "user") => {
      try {
        toastShownRef.current = false;
        const constraints: MediaStreamConstraints = {
          video: { facingMode: cameraFacingMode },
        };

        const mediaStream =
          await navigator.mediaDevices.getUserMedia(constraints);

        if (mediaStream == null) {
          return { hasPermission: false, mediaStream: null };
        }

        return { hasPermission: true, mediaStream: mediaStream };
      } catch (_error) {
        if (!toastShownRef.current) {
          toastShownRef.current = true;
          toast.warning(t("camera_permission_denied"));
        }
        return { hasPermission: false, mediaStream: null };
      }
    },
    [],
  );

  return { requestPermission };
};
