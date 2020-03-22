export default {

    // Auth Endpoints

    login: {
        path: '/api/v1/auth/login/',
        method: 'POST',
    },

    signUp: {
        path: '/api/v1/auth/signup',
        method: 'POST'
    },

    token_refresh : {
        path: '/api/v1/auth/token/refresh',
        method: 'POST'
    },

    token_verify : {
        path: '/api/v1/auth/token/verify',
        method: 'POST'
    },


// User Endpoints
    currentUser: {
        path: '/api/v1/users/getcurrentuser',
    },

}
