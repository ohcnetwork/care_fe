import * as Notification from "../Utils/Notifications.js";

import { LocalStorageKeys } from "../Common/constants.js";
import routes from "./api.js";

export const actions = {
  FETCH_REQUEST: "FETCH_REQUEST",
  FETCH_REQUEST_SUCCESS: "FETCH_REQUEST_SUCCESS",
  FETCH_REQUEST_ERROR: "FETCH_REQUEST_ERROR",
  SET_DATA: "SET_DATA",
};

// const isRunning: { [key: string]: AbortController } = {};
const isRunning: any = {};

export const setStoreData = (key: string, value: any) => {
  return {
    type: actions.SET_DATA,
    key,
    value,
  };
};

export const fetchDataRequest = (key: string) => {
  return {
    type: actions.FETCH_REQUEST,
    key,
  };
};

export const fetchDataRequestError = (key: string, error: any) => {
  return {
    type: actions.FETCH_REQUEST_ERROR,
    key,
    error,
  };
};

export const fetchResponseSuccess = (key: string, data: any) => {
  return {
    type: actions.FETCH_REQUEST_SUCCESS,
    key,
    data,
  };
};

export interface ResponseWrapper extends Response {
  data: any;
}

export const fireRequest = (
  key: string,
  path: any = [],
  params: any = {},
  pathParam?: any,
  altKey?: string,
  suppressNotif = false
) => {
  return (dispatch: any) => {
    // cancel previous api call
    const requestKey = altKey || key;
    if (isRunning[requestKey]) {
      isRunning[requestKey].abort();
    }
    const controller = new AbortController();
    isRunning[requestKey] = controller;

    // get api url / method
    const request = Object.assign({}, (routes as any)[key]);

    if (path.length > 0) {
      request.path += path.join("/");
    }

    if (request.method === undefined || request.method === "GET") {
      request.method = "GET";
      let qString = "";
      Object.keys(params).forEach((param: any) => {
        if (params[param] !== undefined && params[param] !== "") {
          qString += `${param}=${encodeURIComponent(params[param])}&`;
        }
      });
      if (qString !== "") {
        request.path += `?${qString}`;
      }
    }

    // set dynamic params in the URL
    if (pathParam) {
      Object.keys(pathParam).forEach((param: any) => {
        request.path = request.path.replace(`{${param}}`, pathParam[param]);
      });
    }
    const headers: { [key: string]: string } = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (!request.noAuth) {
      headers["Authorization"] =
        "Bearer " + localStorage.getItem(LocalStorageKeys.accessToken);
    }

    dispatch(fetchDataRequest(key));
    return fetch(request.path, {
      method: request.method,
      headers,
      credentials: "include",
      cache: "default",
      redirect: "follow",
      signal: controller.signal,
      body: request.method === "GET" ? undefined : JSON.stringify(params),
    })
      .then(async (res: Response) => {
        const response: ResponseWrapper = res as ResponseWrapper;
        try {
          response.data = await response.json();
        } catch (error) {
          console.error(error);
          response.data = {};
        }

        if (response.ok) {
          dispatch(fetchResponseSuccess(key, response.data));
          return response;
        }

        dispatch(fetchDataRequestError(key, response));
        if (suppressNotif) {
          return response;
        }

        if (response.status === 400 || response.status === 406) {
          Notification.BadRequest({
            errs: response.data,
          });
          return response;
        }

        if (response.status === 403 && key === "currentUser") {
          localStorage.removeItem(LocalStorageKeys.accessToken);
          return;
        }

        if (response.status === 404 && key === "deleteUser") {
          Notification.Error({
            msg: "Permission denied!",
          });
          return response;
        }

        if (response.status === 429) {
          return response;
        }

        if (response.status > 400 && response.status < 500) {
          if (response?.data?.code === "token_not_valid") {
            window.location.href = "/session-expired";
          }
          Notification.Error({
            msg: response?.data?.detail || "Something went wrong...!",
          });
        }
        return response;
      })
      .catch((error: any) => {
        console.error(error);
        dispatch(fetchDataRequestError(key, error));

        return;
      });
  };
};

export const legacyFireRequest = (
  key: string,
  path: any = [],
  params: any = {},
  successCallback: any = () => undefined,
  errorCallback: any = () => undefined,
  pathParam?: any,
  altKey?: string
) => {
  return () => {
    // cancel previous api call
    const requestKey = altKey || key;
    if (isRunning[requestKey]) {
      isRunning[requestKey].abort();
    }
    const controller = new AbortController();
    isRunning[requestKey] = controller;

    // get api url / method
    const request = Object.assign({}, (routes as any)[key]);

    if (path.length > 0) {
      request.path += path.join("/");
    }

    if (request.method === undefined || request.method === "GET") {
      request.method = "GET";
      let qString = "";
      Object.keys(params).forEach((param: any) => {
        if (params[param] !== undefined && params[param] !== "") {
          qString += `${param}=${encodeURIComponent(params[param])}&`;
        }
      });
      if (qString !== "") {
        request.path += `?${qString}`;
      }
    }

    // set dynamic params in the URL
    if (pathParam) {
      Object.keys(pathParam).forEach((param: any) => {
        request.path = request.path.replace(`{${param}}`, pathParam[param]);
      });
    }

    const headers: { [key: string]: string } = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (!request.noAuth) {
      headers["Authorization"] =
        "Bearer " + localStorage.getItem(LocalStorageKeys.accessToken);
    }

    fetchDataRequest(key);
    return fetch(request.path, {
      method: request.method,
      headers,
      credentials: "include",
      cache: "default",
      redirect: "follow",
      signal: controller.signal,
      body: request.method === "POST" ? JSON.stringify(params) : undefined,
    })
      .then(async (res: Response) => {
        const response: ResponseWrapper = res as ResponseWrapper;

        try {
          response.data = await response.json();
        } catch (error) {
          console.error(error);
          response.data = {};
        }

        if (response.ok) {
          successCallback(response.data);
          return response;
        }

        errorCallback(response);

        if (response.status === 400 || response.status === 406) {
          Notification.BadRequest({
            errs: response.data,
          });
          return response;
        }

        if (response.status === 403 && key === "currentUser") {
          localStorage.removeItem(LocalStorageKeys.accessToken);
          return;
        }

        if (response.status === 404 && key === "deleteUser") {
          Notification.Error({
            msg: "Permission denied!",
          });
          return response;
        }

        if (response.status === 429) {
          return response;
        }

        if (response.status > 400 && response.status < 500) {
          if (response?.data?.code === "token_not_valid") {
            window.location.href = "/session-expired";
          }
          Notification.Error({
            msg: response?.data?.detail || "Something went wrong...!",
          });
        }
        return response;
      })
      .catch((error: any) => {
        console.error(error);
        errorCallback(error);

        return;
      });
  };
};

export const uploadFile = async (
  url: string,
  file: File,
  contentType: string,
  uploadProgressCB: (progress: number) => void
) => {
  const xhr = new XMLHttpRequest();
  return new Promise((resolve, reject) => {
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        uploadProgressCB((event.loaded / event.total) * 100);
      }
    };
    xhr.onloadend = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        return resolve(xhr.response);
      }
      reject("failed to upload file");
    };
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.send(file);
  });
};
