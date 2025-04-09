/**
 * Core image processing utilities that are shared between the useImageCapture hook
 * and the legacy imageCaptureUtils.ts file.
 *
 * INTERNAL UTILITY FILE:
 * This file is meant to be imported only by:
 * - src/hooks/useImageCapture.tsx
 * - src/Utils/imageCaptureUtils.ts
 *
 * It is not intended to be directly imported by components.
 * If your linting or bundling tools report this file as "unimported",
 * consider adding it to the exclude/ignore list for those tools.
 */

/**
 * Crops an image from the source with specified coordinates
 * @param img - The image element to crop
 * @param cropX - Starting X coordinate for cropping
 * @param cropY - Starting Y coordinate for cropping
 * @param cropWidth - Width of the crop area
 * @param cropHeight - Height of the crop area
 * @returns Canvas element with the cropped image, or null if failed
 */
export const cropImage = (
  img: HTMLImageElement,
  cropX: number,
  cropY: number,
  cropWidth: number,
  cropHeight: number,
): HTMLCanvasElement | null => {
  const canvas = document.createElement("canvas");
  canvas.width = cropWidth;
  canvas.height = cropHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }

  // High quality rendering for the crop
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Draw only the cropped portion to the canvas
  ctx.drawImage(
    img,
    cropX,
    cropY, // Source coordinates
    cropWidth,
    cropHeight, // Source dimensions
    0,
    0, // Destination coordinates
    cropWidth,
    cropHeight, // Destination dimensions
  );

  return canvas;
};

/**
 * Converts a canvas to a File object with the appropriate format
 * @param canvas - The canvas to convert
 * @param filename - The filename to use
 * @param format - The image format ('image/png' or 'image/jpeg')
 * @returns Promise that resolves to a File object or null if failed
 */
export const canvasToFile = (
  canvas: HTMLCanvasElement,
  filename: string,
  format: string = "image/png",
): Promise<File | null> => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], filename, { type: format });
        resolve(file);
      } else {
        resolve(null);
      }
    }, format);
  });
};

/**
 * Core image processing function that handles cropping for different image sources
 * @param imageSrc - The image source (data URL)
 * @param baseName - Base filename to use (without extension)
 * @param cropOptions - Options for cropping the image
 * @param errorMessages - Custom error messages for different scenarios
 * @returns Promise that resolves to a processed file or error
 */
export const processImageCore = (
  imageSrc: string,
  baseName: string,
  cropOptions: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
  errorMessages: {
    processingError: string;
  },
): Promise<{ file: File | null; error?: string }> => {
  return new Promise((resolve) => {
    try {
      const img = new Image();

      img.onload = async () => {
        try {
          // Crop the image according to provided coordinates
          const canvas = cropImage(
            img,
            cropOptions.x,
            cropOptions.y,
            cropOptions.width,
            cropOptions.height,
          );

          if (!canvas) {
            resolve({ file: null, error: errorMessages.processingError });
            return;
          }

          // Convert to PNG file (no compression)
          const file = await canvasToFile(
            canvas,
            `${baseName}.png`,
            "image/png",
          );

          if (file) {
            resolve({ file });
          } else {
            resolve({ file: null, error: errorMessages.processingError });
          }
        } catch (_error) {
          resolve({ file: null, error: errorMessages.processingError });
        }
      };

      img.onerror = () => {
        resolve({ file: null, error: errorMessages.processingError });
      };

      img.src = imageSrc;
    } catch (_error) {
      resolve({ file: null, error: errorMessages.processingError });
    }
  });
};
