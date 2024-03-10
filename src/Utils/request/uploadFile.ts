import { Dispatch, SetStateAction } from "react";
import { handleUploadPercentage } from "./utils";

const uploadFile = (
  url: string,
  file: File | FormData,
  reqMethod: string,
  headers: object,
  onLoad: (xhr: XMLHttpRequest) => void,
  setUploadPercent: Dispatch<SetStateAction<number>> | null,
  onError: () => void
) => {
  const xhr = new XMLHttpRequest();
  xhr.open(reqMethod, url);

  Object.entries(headers).forEach(([key, value]) => {
    xhr.setRequestHeader(key, value);
  });

  xhr.onload = () => {
    onLoad(xhr);
  };

  if (setUploadPercent != null) {
    xhr.upload.onprogress = (event: ProgressEvent) => {
      handleUploadPercentage(event, setUploadPercent);
    };
  }

  xhr.onerror = () => {
    onError();
  };
  xhr.send(file);
};

export default uploadFile;
