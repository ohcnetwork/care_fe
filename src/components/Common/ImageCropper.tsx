import React, { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import { getCroppedImg } from "@/Utils/getCroppedImg";

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
  isProcessing?: boolean;
}

/**
 * A reusable image cropper component
 */
const ImageCropper = ({
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio = 1,
  isProcessing = false,
}: ImageCropperProps) => {
  const { t } = useTranslation();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(
    null,
  );
  const [isCropping, setIsCropping] = useState(false);

  const handleCropComplete = useCallback(
    (
      _croppedArea: { x: number; y: number; width: number; height: number },
      croppedAreaPixels: {
        x: number;
        y: number;
        width: number;
        height: number;
      },
    ) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleCropImage = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      return;
    }

    setIsCropping(true);
    try {
      // Get cropped image
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);

      // Make sure we have a valid cropped image result
      if (!croppedImage) {
        throw new Error(t("AVATAR_EDIT__UNABLE_TO_CROP"));
      }

      onCropComplete(croppedImage);
    } catch (error) {
      console.error("Cropping error:", error);
    } finally {
      setIsCropping(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full overflow-hidden relative h-[48vh] max-h-[300px] mx-auto">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
        />
      </div>

      <div className="flex gap-4 justify-center">
        <Button variant="outline" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button
          onClick={handleCropImage}
          variant="primary"
          disabled={isProcessing || isCropping}
        >
          {isProcessing || isCropping ? (
            <CareIcon icon="l-spinner" className="animate-spin text-lg mr-1" />
          ) : null}
          {t("crop")}
        </Button>
      </div>
    </div>
  );
};

export default ImageCropper;
