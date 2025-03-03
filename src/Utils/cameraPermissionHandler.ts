import { toast } from "sonner";

let toastShown = false;

export const handleCameraPermission = async (cameraFacingMode: string, onPermissionDenied: () => void) => {
    toastShown = false;
    try {
        await navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraFacingMode } });
    } catch (error) {
        if (!toastShown) {
            toastShown = true; // Ensures only one toast is shown
            toast.warning("Camera permission denied");
        }
        onPermissionDenied();
    }
};
