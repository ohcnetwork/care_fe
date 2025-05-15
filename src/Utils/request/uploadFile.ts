import { t } from "i18next";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

import * as Notification from "@/Utils/Notifications";
import { handleUploadPercentage } from "@/Utils/request/utils";

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
        // Extracting messages from response Text
        let userFriendlyMessages: string[] = [];
        if (error?.errors && Array.isArray(error.errors)) {
          error.errors.forEach((err: any) => {
            if (
              err.msg?.profile_picture &&
              Array.isArray(err.msg.profile_picture)
            ) {
              userFriendlyMessages = userFriendlyMessages.concat(
                err.msg.profile_picture,
              );
            }
          });
        }

        if (userFriendlyMessages.length > 0) {
          // Combining messages into a single string
          const message = userFriendlyMessages.join("\n• ");
          Notification.BadRequest({ errs: `• ${message}` });
        } else {
          Notification.BadRequest({ errs: error.errors });
        }
        reject(new Error("Client error"));
        reject(new Error("Client error"));
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
