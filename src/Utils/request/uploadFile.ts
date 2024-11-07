import { Dispatch, SetStateAction } from "react";

import * as Notification from "@/Utils/Notifications";
import { handleUploadPercentage } from "@/Utils/request/utils";

const uploadFile = (
  url: string,
  file: File | FormData,
  reqMethod: string,
  headers: object,
  onLoad: (xhr: XMLHttpRequest) => void,
  setUploadPercent: Dispatch<SetStateAction<number>> | null,
  onError: () => void,
) => {
  const xhr = new XMLHttpRequest();
  xhr.open(reqMethod, url);

  Object.entries(headers).forEach(([key, value]) => {
    xhr.setRequestHeader(key, value);
  });

  xhr.onload = () => {
    onLoad(xhr);
    if (400 <= xhr.status && xhr.status <= 499) {
      const error = JSON.parse(xhr.responseText);
      if (typeof error === "object" && !Array.isArray(error)) {
        Object.values(error).forEach((msg) => {
          Notification.Error({ msg: msg || "Something went wrong!" });
        });
      } else {
        Notification.Error({ msg: error || "Something went wrong!" });
      }
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
  };
  xhr.send(file);
};

export default uploadFile;
