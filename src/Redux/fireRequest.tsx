import axios from 'axios';
import api from './api';
import * as Notification from '../Utils/Notifications.js';

const requestMap: any = api;
export const actions = {
    FETCH_REQUEST: 'FETCH_REQUEST',
    FETCH_REQUEST_SUCCESS: 'FETCH_REQUEST_SUCCESS',
    FETCH_REQUEST_ERROR: 'FETCH_REQUEST_ERROR',
    SET_DATA: 'SET_DATA',
};

const config: any = {
    headers: {},
};

const isRunning: any = {}

if (localStorage.getItem('care_access_token')) {
    config.headers['Authorization'] = 'Bearer ' + localStorage.getItem('care_access_token');
}

const axiosApiCall: any = axios.create(config);

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
    key: string, path: any = [], params: object = {}, urlParam?: any
) => {
    return (dispatch: any) => {
        if (isRunning[key]) {
            isRunning[key].cancel();
        }
        isRunning[key] = axios.CancelToken.source();
        const request = Object.assign({}, requestMap[key]);
        if (path.length > 0) {
            request.path += '/' + path.join('/');
        }

        if (request.method === undefined || request.method === 'GET') {
            request.method = 'GET';
            const qs = $.param(params);
            if (qs !== '') {
                request.path += `?${qs}`;
            }
        }

        if (urlParam) {
            Object.keys(urlParam).forEach((param: any) => {
                request.path = request.path.replace(`{${param}}`, urlParam[param])
            })
        }
        dispatch(fetchDataRequest(key));
        return axiosApiCall[request.method.toLowerCase()](request.path, {
            ...params,
            cancelToken: isRunning[key].token
        }).then((response: any) => {
            dispatch(fetchResponseSuccess(key, response.data));
            return response;
        }).catch((error: any) => {

            // 400 Bad Request Error
            if (error.response.status === 400) {
                Notification.BadRequest({
                    errs: error.response.data
                });
                return;
            }

            // FIX-ME:  (Temporary) Ignore 403 Error
            // This error is ignored because on the first page load 
            // 403 error is displayed for invalid credential.
            
            /** Other 4xx Errors and 5xx Errors */ 
            /** can use the basic error handler */

            // 4xx Erros
            if (error.response.status !== 403 &&
                error.response.status > 400 && 
                error.response.status < 500) {
                if ( error.response.data && error.response.data.detail ){
                    Notification.Error({
                        msg: error.response.data.detail
                    });
                } else {
                    Notification.Error({
                        msg: 'Something went Wrong...!'
                    });
                    return;
                }
            }

            // 5xx Errors
            if ( error.response.status >=500 && error.response.status < 599 ) {
                Notification.Error({
                    msg: 'Something went Wrong...!'
                });
                return;
            }

            dispatch(fetchDataRequestError(key, error));
            return error.response;
        });
    };
};