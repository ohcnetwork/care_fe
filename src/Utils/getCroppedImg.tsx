const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous"); // needed to avoid cross-origin issues on some browsers
    image.src = url;
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
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return Promise.resolve("");
  }

  const { x, y, width, height } = croppedAreaPixels;

  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(image, x, y, width, height, 0, 0, width, height);

  return new Promise<string>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        return resolve("");
      }
      resolve(URL.createObjectURL(blob));
    }, "image/png");
  });
}
