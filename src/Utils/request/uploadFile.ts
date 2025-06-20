import { t } from "i18next";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

import { handleUploadPercentage } from "@/Utils/request/utils";

import { handleHttpError } from "./errorHandler";
import { HTTPError } from "./types";

const uploadFile = async (
  url: string,
  file: File | FormData,
  reqMethod: string,
  headers: object,
  onLoad: (xhr: XMLHttpRequest) => void,
  setUploadPercent: Dispatch<SetStateAction<number>> | null,
  onError: () => void,
  options?: {
    fileSize?: number;
    totalBytes?: number;
    bytesUploadedSoFar?: number;
    setOverallProgress?: (percent: number) => void;
    lastFilePercentRef?: { current: number };
  },
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
        const httpError = new HTTPError({
          message: "Request failed",
          status: xhr.status,
          silent: false,
          cause: error,
        });

        handleHttpError(httpError);
        reject(httpError);
      } else {
        if (
          options &&
          options.setOverallProgress &&
          options.fileSize &&
          options.totalBytes &&
          options.lastFilePercentRef
        ) {
          options.bytesUploadedSoFar =
            (options.bytesUploadedSoFar || 0) +
            (options.fileSize -
              Math.round(
                (options.lastFilePercentRef.current / 100) * options.fileSize,
              ));
          options.setOverallProgress(
            options.totalBytes > 0
              ? (options.bytesUploadedSoFar / options.totalBytes) * 100
              : 0,
          );
        }
        resolve();
      }
    };

    if (setUploadPercent != null || (options && options.setOverallProgress)) {
      xhr.upload.onprogress = (event: ProgressEvent) => {
        if (setUploadPercent) {
          handleUploadPercentage(event, setUploadPercent);
        }
        if (
          options &&
          options.setOverallProgress &&
          options.fileSize &&
          options.totalBytes &&
          options.lastFilePercentRef
        ) {
          const percent = event.lengthComputable
            ? (event.loaded / event.total) * 100
            : 0;
          if (typeof percent === "number") {
            options.bytesUploadedSoFar =
              (options.bytesUploadedSoFar || 0) -
              Math.round(
                (options.lastFilePercentRef.current / 100) * options.fileSize,
              );
            options.bytesUploadedSoFar += Math.round(
              (percent / 100) * options.fileSize,
            );
            options.lastFilePercentRef.current = percent;
            options.setOverallProgress(
              options.totalBytes > 0
                ? (options.bytesUploadedSoFar / options.totalBytes) * 100
                : 0,
            );
          }
        }
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
