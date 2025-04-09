/**
 * Public API for image utilities
 *
 * This file re-exports the public image utilities to provide a clear,
 * documented import path for components and other parts of the codebase.
 */

// Export the hook (recommended approach)
export { default as useImageCapture } from "@/hooks/useImageCapture";

// Re-export legacy utilities (deprecated, but maintained for backward compatibility)
export {
  canvasToFile,
  // Legacy API (deprecated)
  processWebcamImage,
  captureWebcamImage,
  processCroppedImage,
} from "./imageCaptureUtils";

// Note: imageProcessingCore.ts is an internal utility not meant to be directly imported
