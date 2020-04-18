export default {

    // Auth Endpoints
    login: {
        path: '/api/v1/auth/login/',
        method: 'POST',
        noAuth: true,
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
        method: 'POST',
        noAuth: true,
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

    addUser: {
        path: "/api/v1/users/add_user/",
        method: 'POST',
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
    getConsultationList: {
        path: '/api/v1/consultation/'
    },
    createConsultation: {
        path: '/api/v1/consultation/',
        method: 'POST',
    },
    getConsultation: {
        path: '/api/v1/consultation',
    },
    updateConsultation: {
        path: '/api/v1/consultation',
        method: 'PUT',
    },
    partialUpdateConsultation: {
        path: '/api/v1/consultation/{id}/',
        method: 'PATCH'
    },
    deleteConsultation: {
        path: '/api/v1/consultation/{id}/',
        method: 'DELETE'
    },
    createDailyRounds: {
        path: '/api/v1/consultation/{consultationId}/daily_rounds/',
        method: 'POST'
    },
    updateDailyReport: {
        path: '/api/v1/consultation/{consultationId}/daily_rounds/{id}/',
        method: 'PUT'
    },
    getDailyReports: {
        path: '/api/v1/consultation/{consultationId}/daily_rounds',
    },
    // Ambulance

    createAmbulance: {
        path: '/api/v1/ambulance/create/',
        method: 'POST',
        noAuth: true,
    },
    listAmbulance: {
        path: '/api/v1/ambulance',
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

    //Triage
    createTriage: {
        path: '/api/v1/facility/{facilityId}/patient_stats/',
        method: 'POST'
    },
    getTriage: {
        path: '/api/v1/facility/{facilityId}/patient_stats',
    },

    // //Care Center
    // createCenter: {
    //     path: "/api/v1/carecenter/",
    //     method: 'POST'
    // }

    // Patient

    searchPatient: {
        path: "/api/v1/patient/search",
    },
    patientList: {
        path: "/api/v1/patient",
    },
    addPatient: {
        path: "/api/v1/patient/",
        method: 'POST'
    },
    getPatient: {
        path: '/api/v1/patient/{id}/'
    },
    updatePatient: {
        path: '/api/v1/patient/{id}/',
        method: 'PUT'
    },
    transferPatient: {
        path: '/api/v1/patient/{id}/transfer/',
        method: 'POST'
    },
    sampleTestList: {
        path: '/api/v1/patient/{patientId}/test_sample/',
    },
    createSampleTest: {
        path: '/api/v1/patient/{patientId}/test_sample/',
        method: 'POST',
    },
    getSampleTest: {
        path: '/api/v1/patient/{patientId}/test_sample/{id}/',
    },
    patchSampleTest: {
        path: '/api/v1/patient/{patientId}/test_sample/{id}/',
        method: 'PATCH',
    },
    sampleReport: {
        path: '/api/v1/patient/{id}/icmr_sample'
    },

    // States
    statesList: {
        path: "/api/v1/state/",
    },

    getState: {
        path: "/api/v1/state/{id}/",
    },

    // Districts
    districtsList: {
        path: "/api/v1/district/",
    },
    getDistrict: {
        path: "/api/v1/district/{id}/",
    },
    getDistrictByState: {
        path: "/api/v1/state/{id}/districts/",
    },

    // Local Body
    localBodyList: {
        path: "/api/v1/local_body/",
    },
    getLocalBody: {
        path: "/api/v1/local_body/{id}/",
    },
    getLocalbodyByDistrict: {
        path: "/api/v1/district/{id}/local_bodies/",
    },

    // Sample Test
    getTestSampleList: {
        path: '/api/v1/test_sample'
    },
    getTestSample: {
        path: '/api/v1/test_sample',
        method: 'POST'
    },
    patchSample: {
        path: '/api/v1/test_sample',
        method: 'PATCH',
    },

}
