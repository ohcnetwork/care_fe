import { t } from "i18next";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

import { handleUploadPercentage } from "@/Utils/request/utils";

import { handleHttpError } from "./errorHandler";

const uploadFile = async (
  url: string,
  file: File | FormData,
  reqMethod: string,
  headers: object,
  onLoad: (xhr: XMLHttpRequest) => void,
  setUploadPercent: Dispatch<SetStateAction<number>> | null,
  onError: () => void,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(reqMethod, url);

    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    xhr.onload = () => {
      onLoad(xhr);
      if (400 <= xhr.status && xhr.status <= 499) {
        let error;
        try {
          error = JSON.parse(xhr.responseText);
        } catch {
          error = xhr.responseText;
        }
        const profileErrors = error?.errors?.[0]?.msg?.profile_picture || [];
        const hasImageShouldBeError = profileErrors.some((msg: string) =>
          msg.toLowerCase().includes("image size is greater than"),
        );

        error = hasImageShouldBeError
          ? new Error("Image size should be up to 1 MB")
          : new Error("Client error");

        handleHttpError(error);
        reject(error);
      } else {
        resolve();
      }
    };

    if (setUploadPercent != null) {
      xhr.upload.onprogress = (event: ProgressEvent) => {
        handleUploadPercentage(event, setUploadPercent);
      };
    }

    xhr.onerror = () => {
      toast.error(t("network_failure"));
      onError();
      reject(new Error("Network error"));
    };

    xhr.send(file);
  });
};
export default uploadFile;
