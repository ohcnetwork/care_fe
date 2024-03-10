const uploadFile = (
  url: string,
  file: File | FormData,
  reqMethod: string,
  headers: object,
  onLoad: (xhr: XMLHttpRequest) => void,
  onProgress: ((event: ProgressEvent) => void) | null,
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

  if (onProgress !== null) {
    xhr.upload.onprogress = (event: ProgressEvent) => {
      onProgress(event);
    };
  }

  xhr.onerror = () => {
    onError();
  };
  xhr.send(file);
};

export default uploadFile;
