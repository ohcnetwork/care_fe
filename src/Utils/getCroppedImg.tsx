import i18next from "i18next";

// Helper function to sanitize URLs
const sanitizeUrl = (url: string): string => {
  // Only allow specific URL schemes
  if (
    url.startsWith("blob:") ||
    url.startsWith("data:image/") ||
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }
  return "";
};

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");

    // Sanitize URL before setting it as src
    const sanitizedUrl = sanitizeUrl(url);
    if (sanitizedUrl) {
      image.src = sanitizedUrl;
    } else {
      reject(new Error(i18next.t("AVATAR_EDIT__INVALID_IMAGE_URL")));
    }
  });

// Define interface for cropped area pixels
interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function getCroppedImg(
  imageSrc: string,
  croppedAreaPixels: CroppedAreaPixels,
) {
  try {
    if (!imageSrc) {
      return "";
    }

    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return "";
    }

    const { x, y, width, height } = croppedAreaPixels;

    // Validate crop dimensions
    if (width <= 0 || height <= 0) {
      return "";
    }

    canvas.width = width;
    canvas.height = height;

    // Draw the cropped image
    ctx.drawImage(image, x, y, width, height, 0, 0, width, height);

    return new Promise<string>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          return resolve("");
        }
        const url = URL.createObjectURL(blob);
        resolve(url);
      }, "image/png");
    });
  } catch (_error) {
    return "";
  }
}
