import * as Notification from "../Utils/Notifications.js";

import { isEmpty, omitBy } from "lodash-es";

import { LocalStorageKeys } from "../Common/constants";
import api from "./api";
import axios from "axios";

const requestMap: any = api;
export const actions = {
  FETCH_REQUEST: "FETCH_REQUEST",
  FETCH_REQUEST_SUCCESS: "FETCH_REQUEST_SUCCESS",
  FETCH_REQUEST_ERROR: "FETCH_REQUEST_ERROR",
  SET_DATA: "SET_DATA",
};

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

export const fireRequest = (
  key: string,
  path: any = [],
  params: any = {},
  pathParam?: any,
  altKey?: string,
  suppressNotif?: boolean,
) => {
  return (dispatch: any) => {
    // cancel previous api call
    if (isRunning[altKey ? altKey : key]) {
      isRunning[altKey ? altKey : key].cancel();
    }
    isRunning[altKey ? altKey : key] = axios.CancelToken.source();
    // get api url / method
    const request = Object.assign({}, requestMap[key]);
    if (path.length > 0) {
      request.path += "/" + path.join("/");
    }
    // add trailing slash to path before query paramaters
    if (request.path.slice(-1) !== "/" && request.path.indexOf("?") === -1) {
      request.path += "/";
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

    // set authorization header in the request header
    const config: any = {
      headers: {},
    };
    if (!request.noAuth) {
      const access_token = localStorage.getItem(LocalStorageKeys.accessToken);
      if (access_token) {
        config.headers["Authorization"] = "Bearer " + access_token;
      } else {
        // The access token is missing from the local storage. Redirect to login page.
        window.location.href = "/";
        return;
      }
    }
    const axiosApiCall: any = axios.create(config);

    dispatch(fetchDataRequest(key));
    return axiosApiCall[request.method.toLowerCase()](request.path, {
      ...params,
      cancelToken: isRunning[altKey ? altKey : key].token,
    })
      .then((response: any) => {
        dispatch(fetchResponseSuccess(key, response.data));
        return response;
      })
      .catch((error: any) => {
        dispatch(fetchDataRequestError(key, error));

        if (!(suppressNotif ?? false) && error.response) {
          // temporarily don't show invalid phone number error on duplicate patient check
          if (error.response.status === 400 && key === "searchPatient") {
            return;
          }

          // deleteUser: 404 is for permission denied
          if (error.response.status === 404 && key === "deleteUser") {
            Notification.Error({
              msg: "Permission denied!",
            });
            return;
          }

          // currentUser is ignored because on the first page load
          // 403 error is displayed for invalid credential.
          if (error.response.status === 403 && key === "currentUser") {
            if (localStorage.getItem(LocalStorageKeys.accessToken)) {
              localStorage.removeItem(LocalStorageKeys.accessToken);
            }
            return;
          }

          // 400 Bad Request Error
          if (error.response.status === 400 || error.response.status === 406) {
            Notification.BadRequest({
              errs: error.response.data,
            });
            return error.response;
          }

          // 4xx Errors
          if (error.response.status > 400 && error.response.status < 600) {
            if (error.response.data && error.response.data.detail) {
              if (error.response.data.code === "token_not_valid") {
                window.location.href = `/session-expired?redirect=${window.location.href}`;
              }
              Notification.Error({
                msg: error.response.data.detail,
              });
            } else {
              Notification.Error({
                msg: "Something went wrong...!",
              });
            }
            if (error.response.status === 429) {
              return error.response;
            }
            return;
          }
        } else {
          return error.response;
        }
      });
  };
};

export const fireRequestV2 = (
  key: string,
  path: any = [],
  params: any = {},
  successCallback: any = () => undefined,
  errorCallback: any = () => undefined,
  pathParam?: any,
  altKey?: string,
) => {
  // cancel previous api call
  if (isRunning[altKey ? altKey : key]) {
    isRunning[altKey ? altKey : key].cancel();
  }
  isRunning[altKey ? altKey : key] = axios.CancelToken.source();
  // get api url / method
  const request = Object.assign({}, requestMap[key]);
  if (path.length > 0) {
    request.path += "/" + path.join("/");
  }
  if (request.method === undefined || request.method === "GET") {
    request.method = "GET";
    const qs = new URLSearchParams(omitBy(params, isEmpty)).toString();
    if (qs !== "") {
      request.path += `?${qs}`;
    }
  }
  // set dynamic params in the URL
  if (pathParam) {
    Object.keys(pathParam).forEach((param: any) => {
      request.path = request.path.replace(`{${param}}`, pathParam[param]);
    });
  }

  // set authorization header in the request header
  const config: any = {
    headers: {},
  };
  if (!request.noAuth && localStorage.getItem(LocalStorageKeys.accessToken)) {
    config.headers["Authorization"] =
      "Bearer " + localStorage.getItem(LocalStorageKeys.accessToken);
  }
  const axiosApiCall: any = axios.create(config);

  fetchDataRequest(key);
  return axiosApiCall[request.method.toLowerCase()](request.path, {
    ...params,
    cancelToken: isRunning[altKey ? altKey : key].token,
  })
    .then((response: any) => {
      successCallback(response.data);
    })
    .catch((error: any) => {
      errorCallback(error);
      if (error.response) {
        // temporarily don't show invalid phone number error on duplicate patient check
        if (error.response.status === 400 && key === "searchPatient") {
          return;
        }

        // deleteUser: 404 is for permission denied
        if (error.response.status === 404 && key === "deleteUser") {
          Notification.Error({
            msg: "Permission denied!",
          });
        }

        // currentUser is ignored because on the first page load
        // 403 error is displayed for invalid credential.
        if (error.response.status === 403 && key === "currentUser") {
          if (localStorage.getItem(LocalStorageKeys.accessToken)) {
            localStorage.removeItem(LocalStorageKeys.accessToken);
          }
        }

        // 400 Bad Request Error
        if (error.response.status === 400 || error.response.status === 406) {
          Notification.BadRequest({
            errs: error.response.data,
          });
        }

        // 4xx Errors
        if (error.response.status > 400 && error.response.status < 600) {
          if (error.response.data && error.response.data.detail) {
            Notification.Error({
              msg: error.response.data.detail,
            });
          } else {
            Notification.Error({
              msg: "Something went wrong...!",
            });
          }
          if (error.response.status === 429) {
            return error.response;
          }
          return;
        }
      }
    });
};
