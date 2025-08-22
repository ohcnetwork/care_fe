import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface MediaPermissionResult {
  hasPermission: boolean;
  mediaStream: MediaStream | null;
}

export const useMediaDevicePermission = () => {
  const toastShownRef = useRef(false);
  const { t } = useTranslation();

  const requestPermission = useCallback(
    async (
      options: MediaStreamConstraints = { video: true },
    ): Promise<MediaPermissionResult> => {
      try {
        toastShownRef.current = false;
        const constraints: MediaStreamConstraints = {
          video: options.video,
          audio: options.audio,
        };

        const mediaStream =
          await navigator.mediaDevices.getUserMedia(constraints);

        if (mediaStream == null) {
          return { hasPermission: false, mediaStream: null };
        }

        return { hasPermission: true, mediaStream };
      } catch (_error) {
        if (!toastShownRef.current) {
          toastShownRef.current = true;
          toast.warning(
            options.video
              ? t(`camera_permission_denied`)
              : t(`microphone_permission_denied`),
          );
        }
        return { hasPermission: false, mediaStream: null };
      }
    },
    [],
  );

  return { requestPermission };
};
