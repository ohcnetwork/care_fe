import { useTranslation } from "react-i18next";
import Webcam from "react-webcam";
import { toast } from "sonner";

import { processImageCore } from "@/Utils/imageProcessingCore";

interface CropOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Custom hook for image capture processing with built-in translation support
 * @returns Object containing image capture utility functions
 */
export default function useImageCapture() {
  const { t } = useTranslation();

  /**
   * Process any image (webcam or cropped) with optional cropping parameters
   * @param imageDataUrl - The data URL of the image to process
   * @param filename - Base name for the file (without extension)
   * @param cropOptions - Optional crop coordinates and dimensions
   * @returns Promise that resolves to a File object or null if processing failed
   */
  const processImage = (
    imageDataUrl: string,
    filename: string = "image",
    cropOptions: CropOptions = { x: 0, y: 0, width: 400, height: 400 },
  ): Promise<{ file: File | null; error?: string }> => {
    return processImageCore(imageDataUrl, filename, cropOptions, {
      processingError: t("failed_to_process_image"),
    });
  };

  /**
   * Processes an image taken from webcam
   * @param imageDataUrl - The data URL of the captured image
   * @returns Promise that resolves to a File object or null if processing failed
   */
  const processWebcamImage = (
    imageDataUrl: string,
  ): Promise<{ file: File | null; error?: string }> => {
    return processImage(imageDataUrl, "camera_image");
  };

  /**
   * Processes a cropped image
   * @param croppedImageSrc - The data URL of the cropped image
   * @param cropOptions - Cropping coordinates and dimensions
   * @returns Promise resolving to file and metadata
   */
  const processCroppedImage = (
    croppedImageSrc: string,
    cropOptions: CropOptions = { x: 0, y: 0, width: 400, height: 400 },
  ): Promise<{ file: File | null; error?: string }> => {
    return processImage(croppedImageSrc, "cropped_image", cropOptions);
  };

  /**
   * Captures an image from a webcam ref and processes it
   * @param webRef - Reference to the webcam component
   * @returns Promise that resolves to the processed image data
   */
  const captureWebcamImage = async (webRef: React.RefObject<Webcam>) => {
    if (!webRef.current) {
      return {
        screenshot: null,
        file: null,
        error: t("camera_not_available"),
      };
    }

    const screenshot = webRef.current.getScreenshot();
    if (!screenshot) {
      return {
        screenshot: null,
        file: null,
        error: t("failed_to_capture_image"),
      };
    }

    const { file, error } = await processWebcamImage(screenshot);

    if (error) {
      toast.error(error);
    }

    return {
      screenshot,
      file,
      error,
    };
  };

  return {
    processImage,
    processWebcamImage,
    processCroppedImage,
    captureWebcamImage,
  };
}
