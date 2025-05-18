export const compressImage = (
  blob: Blob,
  quality: number,
  maxSize: number,
  callback: (compressedBlob: Blob) => void,
) => {
  // Create an image to draw to canvas for compression
  const img = new Image();
  img.onload = () => {
    // Create a canvas to compress the image
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw the image to the canvas
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(img, 0, 0);

      // Convert to blob with compression
      canvas.toBlob(
        (compressedBlob) => {
          if (compressedBlob) {
            // If still too large and quality can be reduced further, compress more
            if (compressedBlob.size > maxSize && quality > 0.5) {
              compressImage(blob, quality - 0.1, maxSize, callback);
            } else {
              callback(compressedBlob);
            }
          } else {
            // Fallback if compression fails
            callback(blob);
          }
        },
        "image/jpeg",
        quality,
      );
    } else {
      // Fallback if canvas context fails
      callback(blob);
    }
  };

  // Load the image from the blob
  img.src = URL.createObjectURL(blob);
};
