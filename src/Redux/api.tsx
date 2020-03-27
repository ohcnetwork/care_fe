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

    token_refresh: {
        path: '/api/v1/auth/token/refresh',
        method: 'POST'
    },

    token_verify: {
        path: '/api/v1/auth/token/verify',
        method: 'POST'
    },


    // User Endpoints
    currentUser: {
        path: '/api/v1/users/getcurrentuser',
    },

    userList: {
        path: '/api/v1/users',
    },
    readUser: {
        path: '/api/v1/users',
    },


    createUser: {
        path: '/api/v1/users/',
        method: 'POST'
    },

    updateUser: {
        path: '/api/v1/users',
        method: 'PUT'
    },

    partialUpdateUser: {
        path: '/api/v1/users',
        method: 'PATCH'
    },
    deleteUser: {
        path: '/api/v1/users',
        method: 'DELETE'
    },


    // Facility Endpoints

    listFacility: {
        path: '/api/v1/facility'
    },

    createFacility: {
        path: '/api/v1/facility/',
        method: 'POST'
    },

    getFacility: {
        path: '/api/v1/facility'
    },

    updateFacility: {
        path: '/api/v1/facility',
        method: 'PUT'
    },

    partialUpdateFacility: {
        path: '/api/v1/facility',
        method: 'PATCH'
    },

    deleteFacility: {
        path: '/api/v1/facility',
        method: 'DELETE'
    },

    // Ambulance

    createAmbulance: {
        path: '/api/v1/ambulance/',
        method: 'POST'
    },

    // Hospital Beds
    createCapacity: {
        path: "/api/v1/facility/{facilityId}/capacity/",
        method: 'POST'
    },

    createDoctor: {
        path: "/api/v1/facility/{facilityId}/hospital_doctor/",
        method: 'POST'
    },

    getCapacity: {
        path: '/api/v1/facility/{facilityId}/capacity'
    },

    getDoctor: {
        path: '/api/v1/facility/{facilityId}/hospital_doctor'
    },

    updateCapacity: {
        path: '/api/v1/facility/{facilityId}/capacity',
        method: 'PUT'
    },

    updateDoctor: {
        path: '/api/v1/facility/{facilityId}/hospital_doctor',
        method: 'PUT'
    },
    // //Care Center
    // createCenter: {
    //     path: "/api/v1/carecenter/",
    //     method: 'POST'
    // }


}
