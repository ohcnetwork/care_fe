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
  let completedFilesBytes = 0;
  const errors: File[] = [];

  const updateProgress = (currentFileBytes: number) => {
    const totalUploadedBytes = completedFilesBytes + currentFileBytes;
    setProgress(totalBytes > 0 ? (totalUploadedBytes / totalBytes) * 100 : 0);
  };

  for (const [index, file] of files.entries()) {
    try {
      const data = await createUploadFn(file, index);
      if (data) {
        await new Promise<void>((resolve, reject) => {
          uploadFile(
            data.signed_url,
            new File([file], `${data.internal_name}`),
            "PUT",
            { "Content-Type": file.type },
            async (xhr: XMLHttpRequest) => {
              if (xhr.status >= 200 && xhr.status < 300) {
                completedFilesBytes += file.size;
                updateProgress(0);
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
                const currentFileBytes = Math.round(
                  (percent / 100) * file.size,
                );
                updateProgress(currentFileBytes);
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
