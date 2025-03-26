import Webcam from "react-webcam";
import { toast } from "sonner";

/**
 * Resizes an image while maintaining aspect ratio
 * @param img - The image element to resize
 * @returns Object containing width, height, and adjusted dimensions
 */
export const calculateImageDimensions = (img: HTMLImageElement) => {
  // Make sure dimensions meet backend requirements (min 400x400, max 1024x1024)
  let width = Math.max(400, Math.min(img.width, 1024));
  let height = Math.max(400, Math.min(img.height, 1024));

  // Maintain aspect ratio for the largest dimension
  if (img.width > img.height) {
    height = Math.round(img.height * (width / img.width));
    // Ensure height is at least 400px
    if (height < 400) {
      height = 400;
      width = Math.round(img.width * (height / img.height));
    }
  } else {
    width = Math.round(img.width * (height / img.height));
    // Ensure width is at least 400px
    if (width < 400) {
      width = 400;
      height = Math.round(img.height * (width / img.width));
    }
  }

  return {
    width,
    height,
    originalWidth: img.width,
    originalHeight: img.height,
  };
};

/**
 * Creates a canvas with the image drawn to it with the specified dimensions
 * @param img - The image element to draw
 * @param width - The desired width
 * @param height - The desired height
 * @returns Canvas element with the image drawn to it, or null if failed
 */
export const createImageCanvas = (
  img: HTMLImageElement,
  width: number,
  height: number,
): HTMLCanvasElement | null => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }

  // Use higher quality rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  return canvas;
};

/**
 * Creates a scaled-down version of the canvas for size reduction
 * @param img - The image element to draw
 * @param width - The original width
 * @param height - The original height
 * @param scale - The scale factor (0-1)
 * @returns A new canvas with reduced dimensions
 */
export const createScaledCanvas = (
  img: HTMLImageElement,
  width: number,
  height: number,
  scale: number = 0.8,
): HTMLCanvasElement => {
  const smallerCanvas = document.createElement("canvas");
  smallerCanvas.width = width * scale;
  smallerCanvas.height = height * scale;

  const smallerCtx = smallerCanvas.getContext("2d");
  if (smallerCtx) {
    smallerCtx.drawImage(img, 0, 0, smallerCanvas.width, smallerCanvas.height);
  }

  return smallerCanvas;
};

/**
 * Converts a canvas to a File object with the appropriate format and compression
 * @param canvas - The canvas to convert
 * @param filename - The filename to use
 * @param format - The image format ('image/png' or 'image/jpeg')
 * @param quality - The compression quality (0-1)
 * @returns Promise that resolves to a File object or null if failed
 */
export const canvasToFile = (
  canvas: HTMLCanvasElement,
  filename: string,
  format: string = "image/png",
  quality: number = 0.9,
): Promise<File | null> => {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], filename, { type: format });
          resolve(file);
        } else {
          resolve(null);
        }
      },
      format,
      quality,
    );
  });
};

/**
 * Processes the captured image with appropriate size and quality constraints
 * @param imageDataUrl - The data URL of the captured image
 * @param t - Translation function for error messages
 * @returns Promise that resolves to a File object or null if processing failed
 */
export const processWebcamImage = (
  imageDataUrl: string,
  t: (key: string) => string,
): Promise<{ file: File | null; error?: string }> => {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = async () => {
      // Calculate dimensions that maintain aspect ratio
      const { width, height } = calculateImageDimensions(img);

      // Draw image to canvas
      const canvas = createImageCanvas(img, width, height);
      if (!canvas) {
        resolve({ file: null, error: t("failed_to_process_image") });
        return;
      }

      // Try with PNG format first (highest quality)
      try {
        const pngBlob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, "image/png", 0.9);
        });

        if (!pngBlob) {
          resolve({ file: null, error: t("failed_to_process_image") });
          return;
        }

        // Check size limits
        if (pngBlob.size < 1024) {
          // If image is too small, try again with no compression
          const highQualityBlob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, "image/png", 1.0);
          });

          if (highQualityBlob && highQualityBlob.size >= 1024) {
            const file = new File([highQualityBlob], "camera_image.png", {
              type: "image/png",
            });
            resolve({ file });
          } else {
            resolve({ file: null, error: t("image_too_small_in_size") });
          }
        } else if (pngBlob.size > 2 * 1024 * 1024) {
          // If image is too large, compress more with JPEG
          const jpegBlob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, "image/jpeg", 0.85);
          });

          if (jpegBlob && jpegBlob.size <= 2 * 1024 * 1024) {
            const file = new File([jpegBlob], "camera_image.jpg", {
              type: "image/jpeg",
            });
            resolve({ file });
          } else {
            // If still too large, use lower resolution
            const smallerCanvas = createScaledCanvas(img, width, height, 0.8);
            const smallerBlob = await new Promise<Blob | null>((resolve) => {
              smallerCanvas.toBlob(resolve, "image/jpeg", 0.7);
            });

            if (smallerBlob) {
              const file = new File([smallerBlob], "camera_image.jpg", {
                type: "image/jpeg",
              });
              resolve({ file });
            } else {
              resolve({ file: null, error: t("failed_to_process_image") });
            }
          }
        } else {
          // Size is within the acceptable range
          const file = new File([pngBlob], "camera_image.png", {
            type: "image/png",
          });
          resolve({ file });
        }
      } catch (_error) {
        resolve({ file: null, error: t("failed_to_process_image") });
      }
    };

    img.onerror = () => {
      resolve({ file: null, error: t("failed_to_process_image") });
    };

    img.src = imageDataUrl;
  });
};

/**
 * Captures an image from a webcam ref and processes it
 * @param webRef - Reference to the webcam component
 * @param t - Translation function for error messages
 * @returns Promise that resolves to the processed image data
 */
export const captureWebcamImage = async (
  webRef: React.RefObject<Webcam>,
  t: (key: string) => string,
) => {
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

  const { file, error } = await processWebcamImage(screenshot, t);

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
 * Processes a cropped image with appropriate size and quality constraints
 * @param croppedImageSrc - The data URL of the cropped image
 * @param t - Translation function for error messages
 * @returns Promise resolving to file and metadata
 */
export const processCroppedImage = (
  croppedImageSrc: string,
  t: (key: string) => string,
): Promise<{ file: File | null; error?: string }> => {
  return new Promise((resolve) => {
    try {
      // Create an Image element to ensure consistent processing
      const img = new Image();
      img.onload = async () => {
        try {
          // Calculate dimensions that maintain aspect ratio
          const { width, height } = calculateImageDimensions(img);

          // Draw image to canvas
          const canvas = createImageCanvas(img, width, height);
          if (!canvas) {
            resolve({
              file: null,
              error: t("AVATAR_EDIT__ERROR_PROCESSING_IMAGE"),
            });
            return;
          }

          // Try with PNG format first (highest quality)
          try {
            const pngBlob = await new Promise<Blob | null>((resolve) => {
              canvas.toBlob(resolve, "image/png", 0.9);
            });

            if (!pngBlob) {
              resolve({
                file: null,
                error: t("AVATAR_EDIT__ERROR_PROCESSING_IMAGE"),
              });
              return;
            }

            // Check size limits
            if (pngBlob.size < 1024) {
              // If image is too small, try again with no compression
              const highQualityBlob = await new Promise<Blob | null>(
                (resolve) => {
                  canvas.toBlob(resolve, "image/png", 1.0);
                },
              );

              if (highQualityBlob && highQualityBlob.size >= 1024) {
                const file = new File([highQualityBlob], "cropped_image.png", {
                  type: "image/png",
                });
                resolve({ file });
              } else {
                resolve({ file: null, error: t("image_too_small_in_size") });
              }
            } else if (pngBlob.size > 2 * 1024 * 1024) {
              // If image is too large, compress more with JPEG
              const jpegBlob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob(resolve, "image/jpeg", 0.85);
              });

              if (jpegBlob && jpegBlob.size <= 2 * 1024 * 1024) {
                const file = new File([jpegBlob], "cropped_image.jpg", {
                  type: "image/jpeg",
                });
                resolve({ file });
              } else {
                // If still too large, use lower resolution
                const smallerCanvas = createScaledCanvas(
                  img,
                  width,
                  height,
                  0.8,
                );
                const smallerBlob = await new Promise<Blob | null>(
                  (resolve) => {
                    smallerCanvas.toBlob(resolve, "image/jpeg", 0.7);
                  },
                );

                if (smallerBlob) {
                  const file = new File([smallerBlob], "cropped_image.jpg", {
                    type: "image/jpeg",
                  });
                  resolve({ file });
                } else {
                  resolve({
                    file: null,
                    error: t("AVATAR_EDIT__ERROR_PROCESSING_IMAGE"),
                  });
                }
              }
            } else {
              // Size is within the acceptable range
              const file = new File([pngBlob], "cropped_image.png", {
                type: "image/png",
              });
              resolve({ file });
            }
          } catch (_error) {
            resolve({
              file: null,
              error: t("AVATAR_EDIT__ERROR_PROCESSING_IMAGE"),
            });
          }
        } catch (_error) {
          resolve({
            file: null,
            error: t("AVATAR_EDIT__ERROR_PROCESSING_IMAGE"),
          });
        }
      };

      img.onerror = () => {
        resolve({ file: null, error: t("AVATAR_EDIT__ERROR_LOADING_IMAGE") });
      };

      img.src = croppedImageSrc;
    } catch (_error) {
      resolve({ file: null, error: t("AVATAR_EDIT__ERROR_PROCESSING_IMAGE") });
    }
  });
};
