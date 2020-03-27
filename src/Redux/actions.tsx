import axios from 'axios';
import api from './api';

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
        return axiosApiCall[request.method.toLowerCase()](request.path, params)
            .then((response: any) => {
                dispatch(fetchResponseSuccess(key, response.data));
                return response;
            })
            .catch((error: any) => {
                dispatch(fetchDataRequestError(key, error));
                return error.response;
            });
    };
};

// User
export const postLogin = (form: object) => {
    return fireRequest('login', [], form);
};

export const postSignUp = (form: object) => {
    return fireRequest('signUp', [], form);
};

export const getCurrentUser = () => {
    return fireRequest('currentUser');
};

export const signupUser = (form: object) => {
    return fireRequest("createUser", [], form)
};


// Ambulance
export const postAmbulance = (form: object) => {
    return fireRequest('createAmbulance', [], form);
};

// Facility
export const createFacility = (form: object) => {
    return fireRequest("createFacility", [], form)
};
export const getUserList = (paginate: object) => {
    return fireRequest('userList', [], paginate);
};
export const getFacilities = (paginate: object) => {
    return fireRequest('listFacility', [], paginate);
};
export const getFacility = (id: number) => {
    return fireRequest('getFacility', [id], {});
};
export const readUser = (username: any) => {
    return fireRequest('readUser', [username], {});
};

// //Care Center
// export const createCenter = (form: object) => {
//     return fireRequest("createCenter", [], form)
// };

// Hospital
export const createCapacity = (form: object, urlParam: object) => {
    return fireRequest("createCapacity", [], form, urlParam)
};

export const createDoctor = (form: object, urlParam: object) => {
    return fireRequest("createDoctor", [], form, urlParam)
};

export const listCapacity = (paginate: object, urlParam: object) => {
    return fireRequest('listCapacity', [], paginate, urlParam);
};

export const listDoctor = (paginate: object, urlParam: object) => {
    return fireRequest('listDoctor', [], paginate, urlParam);
};

export const getCapacity = (id: number, urlParam: object) => {
    return fireRequest('getCapacity', [id], {}, urlParam);
};

export const getDoctor = (id: number, urlParam: object) => {
    return fireRequest('getDoctor', [id], {}, urlParam);
};

