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

export const uploadMultipleFiles = async (
  files: File[],
  createUploadFn: (file: File, index: number) => Promise<any>,
  markUploadCompleteFn: (args: {
    data: any;
    associating_id: string;
  }) => Promise<any>,
  options: {
    associating_id: string;
    setProgress: (progress: number) => void;
    setError: (msg: string) => void;
  },
): Promise<{ errors: File[] }> => {
  const { associating_id, setProgress, setError } = options;

  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  let bytesUploadedSoFar = 0;
  const errors: File[] = [];

  for (const [index, file] of files.entries()) {
    try {
      const data = await createUploadFn(file, index);
      if (data) {
        let lastFilePercent = 0;
        await new Promise<void>((resolve, reject) => {
          uploadFile(
            data.signed_url,
            new File([file], `${data.internal_name}`),
            "PUT",
            { "Content-Type": file.type },
            async (xhr: XMLHttpRequest) => {
              if (xhr.status >= 200 && xhr.status < 300) {
                bytesUploadedSoFar +=
                  file.size - Math.round((lastFilePercent / 100) * file.size);
                setProgress(
                  totalBytes > 0 ? (bytesUploadedSoFar / totalBytes) * 100 : 0,
                );
                await markUploadCompleteFn({
                  data,
                  associating_id,
                });
                resolve();
              } else {
                toast.error(
                  t("file_error__dynamic", { statusText: xhr.statusText }),
                );
                setError(
                  t("file_error__dynamic", { statusText: xhr.statusText }),
                );
                reject();
              }
            },
            (percent: number | ((prev: number) => number)) => {
              if (typeof percent === "number") {
                bytesUploadedSoFar -= Math.round(
                  (lastFilePercent / 100) * file.size,
                );
                bytesUploadedSoFar += Math.round((percent / 100) * file.size);
                lastFilePercent = percent;
                setProgress(
                  totalBytes > 0 ? (bytesUploadedSoFar / totalBytes) * 100 : 0,
                );
              }
            },
            () => {
              toast.error(t("file_error__network"));
              setError(t("file_error__network"));
              reject();
            },
          );
        });
      }
    } catch {
      errors.push(file);
      setError(t("file_error__network"));
    }
  }
  return { errors };
};

export default uploadFile;
