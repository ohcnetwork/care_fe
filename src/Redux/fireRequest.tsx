import axios from "axios";
import api from "./api";
import * as Notification from "../Utils/Notifications.js";
import querystring from "querystring";
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
  altKey?: string
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
      const qs = querystring.stringify(params);
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
    if (!request.noAuth && localStorage.getItem("care_access_token")) {
      config.headers["Authorization"] =
        "Bearer " + localStorage.getItem("care_access_token");
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
            return;
          }

          // currentUser is ignored because on the first page load
          // 403 error is displayed for invalid credential.
          if (error.response.status === 403 && key === "currentUser") {
            if (localStorage.getItem("care_access_token")) {
              localStorage.removeItem("care_access_token");
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
          if (error.response.status > 400 && error.response.status < 500) {
            if (error.response.status === 429) {
              return error.response;
            } else if (error.response.data && error.response.data.detail) {
              Notification.Error({
                msg: error.response.data.detail,
              });
            } else {
              Notification.Error({
                msg: "Something went wrong...!",
              });
            }
            return;
          }

          // 5xx Errors
          if (error.response.status >= 500 && error.response.status <= 599) {
            Notification.Error({
              msg: "Something went wrong...!",
            });
            return;
          }
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
  altKey?: string
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
    const qs = querystring.stringify(params);
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
  if (!request.noAuth && localStorage.getItem("care_access_token")) {
    config.headers["Authorization"] =
      "Bearer " + localStorage.getItem("care_access_token");
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
          if (localStorage.getItem("care_access_token")) {
            localStorage.removeItem("care_access_token");
          }
        }

        // 400 Bad Request Error
        if (error.response.status === 400 || error.response.status === 406) {
          Notification.BadRequest({
            errs: error.response.data,
          });
        }

        // 4xx Errors
        if (error.response.status > 400 && error.response.status < 500) {
          if (error.response.status === 429) {
            return error.response;
          } else if (error.response.data && error.response.data.detail) {
            Notification.Error({
              msg: error.response.data.detail,
            });
          } else {
            Notification.Error({
              msg: "Something went wrong...!",
            });
          }
        }

        // 5xx Errors
        if (error.response.status >= 500 && error.response.status <= 599) {
          Notification.Error({
            msg: "Something went wrong...!",
          });
          return;
        }
      }
    });
};

export const fireRequestForFiles = (
  key: string,
  path: any = [],
  params: any = {},
  pathParam?: any,
  altKey?: string
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
    if (request.method === undefined || request.method === "GET") {
      request.method = "GET";
      const qs = querystring.stringify(params);
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
      headers: {
        "Content-type": "application/pdf",
        "Content-disposition": "inline",
      },
    };
    // Content-Type: application/pdf
    // Content-Disposition: inline; filename="filename.pdf"
    if (!request.noAuth && localStorage.getItem("care_access_token")) {
      config.headers["Authorization"] =
        "Bearer " + localStorage.getItem("care_access_token");
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

        if (error.response) {
          // temporarily don't show invalid phone number error on duplicate patient check
          if (error.response.status === 400 && key === "searchPatient") {
            return;
          }

          // currentUser is ignored because on the first page load
          // 403 error is displayed for invalid credential.
          if (error.response.status === 403 && key === "currentUser") {
            if (localStorage.getItem("care_access_token")) {
              localStorage.removeItem("care_access_token");
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
          if (error.response.status > 400 && error.response.status < 500) {
            if (error.response.status === 429) {
              return error.response;
            } else if (error.response.data && error.response.data.detail) {
              Notification.Error({
                msg: error.response.data.detail,
              });
            } else {
              Notification.Error({
                msg: "Something went wrong...!",
              });
            }
            return;
          }

          // 5xx Errors
          if (error.response.status >= 500 && error.response.status <= 599) {
            Notification.Error({
              msg: "Something went wrong...!",
            });
            return;
          }
        }
      });
  };
};
