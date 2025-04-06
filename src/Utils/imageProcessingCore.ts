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
 * Core image processing function that handles all the common logic for different image sources
 * @param imageSrc - The image source (data URL)
 * @param baseName - Base filename to use (without extension)
 * @param errorMessages - Custom error messages for different scenarios
 * @returns Promise that resolves to a processed file or error
 */
export const processImageCore = (
  imageSrc: string,
  baseName: string,
  errorMessages: {
    processingError: string;
    tooSmall: string;
  },
): Promise<{ file: File | null; error?: string }> => {
  return new Promise((resolve) => {
    try {
      const img = new Image();

      img.onload = async () => {
        try {
          // Calculate dimensions that maintain aspect ratio
          const { width, height } = calculateImageDimensions(img);

          // Draw image to canvas
          const canvas = createImageCanvas(img, width, height);
          if (!canvas) {
            resolve({ file: null, error: errorMessages.processingError });
            return;
          }

          // Try with PNG format first (highest quality)
          try {
            const pngBlob = await new Promise<Blob | null>((resolve) => {
              canvas.toBlob(resolve, "image/png", 0.9);
            });

            if (!pngBlob) {
              resolve({ file: null, error: errorMessages.processingError });
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
                const file = new File([highQualityBlob], `${baseName}.png`, {
                  type: "image/png",
                });
                resolve({ file });
              } else {
                resolve({ file: null, error: errorMessages.tooSmall });
              }
            } else if (pngBlob.size > 2 * 1024 * 1024) {
              // If image is too large, compress more with JPEG
              const jpegBlob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob(resolve, "image/jpeg", 0.85);
              });

              if (jpegBlob && jpegBlob.size <= 2 * 1024 * 1024) {
                const file = new File([jpegBlob], `${baseName}.jpg`, {
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
                  const file = new File([smallerBlob], `${baseName}.jpg`, {
                    type: "image/jpeg",
                  });
                  resolve({ file });
                } else {
                  resolve({ file: null, error: errorMessages.processingError });
                }
              }
            } else {
              // Size is within the acceptable range
              const file = new File([pngBlob], `${baseName}.png`, {
                type: "image/png",
              });
              resolve({ file });
            }
          } catch (_error) {
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
