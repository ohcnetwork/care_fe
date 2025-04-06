/**
 * @deprecated Use the useImageCapture hook instead
 * This file is maintained for backward compatibility
 */
import { toast } from "sonner";

import {
  calculateImageDimensions,
  canvasToFile,
  createImageCanvas,
  createScaledCanvas,
  processImageCore,
} from "./imageProcessingCore";

// Re-export the utility functions for backward compatibility
export {
  calculateImageDimensions,
  createImageCanvas,
  createScaledCanvas,
  canvasToFile,
};

/**
 * @deprecated Use the useImageCapture hook instead
 */
export const processWebcamImage = (
  imageDataUrl: string,
  t: (key: string) => string,
): Promise<{ file: File | null; error?: string }> => {
  console.warn(
    "processWebcamImage is deprecated. Please use the useImageCapture hook instead.",
  );

  // Create a mock t function that just returns the key if not provided
  const mockT = t || ((key: string) => key);

  return processImageCore(imageDataUrl, "camera_image", {
    processingError: mockT("failed_to_process_image"),
    tooSmall: mockT("image_too_small_in_size"),
  });
};

/**
 * @deprecated Use the useImageCapture hook instead
 */
export const captureWebcamImage = async (
  webRef: React.RefObject<any>,
  t: (key: string) => string,
) => {
  console.warn(
    "captureWebcamImage is deprecated. Please use the useImageCapture hook instead.",
  );

  // Create a mock t function that just returns the key if not provided
  const mockT = t || ((key: string) => key);

  if (!webRef.current) {
    return {
      screenshot: null,
      file: null,
      error: mockT("camera_not_available"),
    };
  }

  const screenshot = webRef.current.getScreenshot();
  if (!screenshot) {
    return {
      screenshot: null,
      file: null,
      error: mockT("failed_to_capture_image"),
    };
  }

  const { file, error } = await processWebcamImage(screenshot, mockT);

  if (error) {
    toast.error(error);
  }

  return {
    screenshot,
    file,
    error,
  };
};

/**
 * @deprecated Use the useImageCapture hook instead
 */
export const processCroppedImage = (
  croppedImageSrc: string,
  t: (key: string) => string,
): Promise<{ file: File | null; error?: string }> => {
  console.warn(
    "processCroppedImage is deprecated. Please use the useImageCapture hook instead.",
  );

  // Create a mock t function that just returns the key if not provided
  const mockT = t || ((key: string) => key);

  return processImageCore(croppedImageSrc, "cropped_image", {
    processingError: mockT("AVATAR_EDIT__ERROR_PROCESSING_IMAGE"),
    tooSmall: mockT("image_too_small_in_size"),
  });
};
