import { Area } from "react-easy-crop";

import { createImage } from "./createImage";

const MIN_DIMENSION = 400;
const MAX_DIMENSION = 1024;
export const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area,
  aspectRatio: number,
): Promise<{ file: File; previewUrl: string }> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Calculate output dimensions based on aspect ratio and constraints
  let outputWidth: number;
  let outputHeight: number;

  if (aspectRatio === 1) {
    // For 1:1, use the smaller dimension but ensure it's within bounds
    const size = Math.min(pixelCrop.width, pixelCrop.height);
    outputWidth = outputHeight = Math.max(
      MIN_DIMENSION,
      Math.min(MAX_DIMENSION, size),
    );
  } else {
    // For 16:9, calculate based on the crop area
    if (pixelCrop.width / pixelCrop.height > aspectRatio) {
      // Width is the limiting factor
      outputHeight = Math.max(
        MIN_DIMENSION,
        Math.min(MAX_DIMENSION, pixelCrop.height),
      );
      outputWidth = Math.min(MAX_DIMENSION, outputHeight * aspectRatio);
    } else {
      // Height is the limiting factor
      outputWidth = Math.max(
        MIN_DIMENSION,
        Math.min(MAX_DIMENSION, pixelCrop.width),
      );
      outputHeight = Math.min(MAX_DIMENSION, outputWidth / aspectRatio);
    }
  }

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  // Enable image smoothing for better quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Clear canvas with white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outputWidth, outputHeight);

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        const file = new File([blob], "cropped-image.jpeg", {
          type: "image/jpeg",
        });
        const previewUrl = canvas.toDataURL("image/jpeg", 0.95);
        resolve({ file, previewUrl });
      },
      "image/jpeg",
      1,
    );
  });
};
