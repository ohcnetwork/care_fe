import { Dispatch, SetStateAction } from "react";

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
        if (typeof error === "object" && !Array.isArray(error)) {
          Object.values(error).forEach((msg) => {
            Notification.Error({ msg: msg || "Something went wrong!" });
          });
        } else {
          Notification.Error({ msg: error || "Something went wrong!" });
        }
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
      Notification.Error({
        msg: "Network Failure. Please check your internet connectivity.",
      });
      onError();
      reject(new Error("Network error"));
    };

    xhr.send(file);
  });
};
export default uploadFile;
