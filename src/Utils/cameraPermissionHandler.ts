import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const { t } = useTranslation();

let toastShown = false;

export const handleCameraPermission = async (
  cameraFacingMode: string,
  onPermissionDenied: () => void,
) => {
  toastShown = false;
  try {
    await navigator.mediaDevices.getUserMedia({
      video: { facingMode: cameraFacingMode },
    });
  } catch (_error) {
    if (!toastShown) {
      toastShown = true;
      toast.warning(t("camera_permission_denied"));
    }
    onPermissionDenied();
  }
};
