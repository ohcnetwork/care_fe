import { fireRequest } from "./fireRequest";

// User
export const postLogin = (queryParam: object) => {
    return fireRequest('login', [], queryParam);
};
export const getCurrentUser = () => {
    return fireRequest('currentUser');
};
export const signupUser = (queryParam: object) => {
    return fireRequest("createUser", [], queryParam)
};


// Ambulance
export const postAmbulance = (queryParam: object) => {
    return fireRequest('createAmbulance', [], queryParam);
};
export const getAmbulanceList = (queryParam: object) => {
    return fireRequest('listAmbulance', [] , queryParam);
};

// Facility
export const createFacility = (queryParam: object) => {
    return fireRequest("createFacility", [], queryParam);
};
export const updateFacility = (id: number, queryParam: object) => {
    return fireRequest('updateFacility', [id], queryParam);
};
export const getUserList = (queryParam: object) => {
    return fireRequest('userList', [], queryParam);
};
export const getFacilities = (queryParam: object) => {
    return fireRequest('listFacility', [], queryParam);
};
export const getFacility = (id: number) => {
    return fireRequest('getFacility', [id], {});
};
export const readUser = (username: any) => {
    return fireRequest('readUser', [username], {});
};

// Capacity/Triage/Doctor
export const createCapacity = (id: number | undefined, queryParam: object, pathParam: object) => {
    return id ? fireRequest('updateCapacity', [id], queryParam, pathParam) : fireRequest("createCapacity", [], queryParam, pathParam);
};
export const createDoctor = (id: number | undefined, queryParam: object, pathParam: object) => {
    return id ? fireRequest('updateDoctor', [id], queryParam, pathParam) : fireRequest("createDoctor", [], queryParam, pathParam);
};
export const createTriageForm = (queryParam: object ,pathParam:object) => {
    return fireRequest('createTriage', [], queryParam, pathParam)
};
export const getTriageInfo = (pathParam: object) => {
    return fireRequest('getTriage', [], {},pathParam)
};
export const getTriageDetails = (id: number, pathParam: object) => {
    return fireRequest('getTriage', [id], {},pathParam)
};
export const listCapacity = (queryParam: object, pathParam: object) => {
    return fireRequest('getCapacity', [], queryParam, pathParam);
};
export const listDoctor = (queryParam: object, pathParam: object) => {
    return fireRequest('getDoctor', [], queryParam, pathParam);
};
export const getCapacity = (id: number, pathParam: object) => {
    return fireRequest('getCapacity', [id], {}, pathParam);
};
export const getDoctor = (id: number, pathParam: object) => {
    return fireRequest('getDoctor', [id], {}, pathParam);
};

//Patient
export const searchPatient = (queryParam: object) => {
    return fireRequest('searchPatient', [], queryParam);
};
export const getAllPatient = (queryParam: object) => {
    return fireRequest('patientList', [], queryParam);
};
export const createPatient = (queryParam: object) => {
    return fireRequest('addPatient', [], queryParam)
};
export const getPatient = (pathParam: object) => {
    return fireRequest('getPatient', [], {}, pathParam);
};
export const updatePatient = (queryParam: object, pathParam: object) => {
    return fireRequest('updatePatient', [], queryParam, pathParam)
};
export const getStates = () => {
    return fireRequest("statesList", [])
}

// District/State/Local body
export const getDistricts = (pathParam: object) => {
    return fireRequest("districtsList", [], {}, pathParam)
}
export const getLocalBody = (pathParam: object) => {
    return fireRequest("localBodyList", [], {}, pathParam)
}
export const getDistrictByState = (pathParam: object) => {
    return fireRequest("getDistrictByState", [], {}, pathParam)
}
export const getLocalbodyByDistrict = (pathParam: object) => {
    return fireRequest("getLocalbodyByDistrict", [], {}, pathParam)
}

// Sample Test
export const getSampleTestList = (params: object, pathParam: object) => {
    return fireRequest("sampleTestList", [], params, pathParam)
}
export const createSampleTest = (queryParam: object, pathParam: object) => {
    return fireRequest('createSampleTest', [], queryParam, pathParam)
};
export const getSampleTest = (id: number, pathParam: object) => {
    return fireRequest('getSampleTest', [id], {}, pathParam)
};

export const sampleReport = (pathParam: object) => {
    return fireRequest('sampleReport', [], {}, pathParam)
};

export const patchSampleTest = (id: number, queryParam: object, pathParam: object) => {
    return fireRequest('patchSampleTest', [id], queryParam, pathParam)
};
export const getTestList = (queryParam: object) => {
    return fireRequest('getTestSampleList', [], queryParam);
};
export const getTestSample = (id: number) => {
    return fireRequest('getTestSample', [id], {});
};
export const patchSample = (id: number, queryParam: object) => {
    return fireRequest('patchSample', [id], queryParam)
};

// Daily Rounds

export const createDailyReport = (queryParam: object, pathParam: object) => {
    return fireRequest('createDailyRounds', [],  queryParam, pathParam)
};
export const updateDailyReport = (queryParam: object, pathParam: object) => {
    return fireRequest('updateDailyReport', [],  queryParam, pathParam)
};
export const getDailyReport = (queryParam: object, pathParam: object) => {
    return fireRequest('getDailyReports', [], queryParam, pathParam)
};
export const getConsultationDailyRoundsDetails = (id: number, pathParam: object) => {
    return fireRequest('getDailyReports', [id], {}, pathParam);
};

// Consultation
export const createConsultation = (queryParam: object) => {
    return fireRequest("createConsultation", [], queryParam);
};
export const getConsultationList = (params: object) => {
    return fireRequest('getConsultationList', [], params);
};
export const getConsultation = (id: number) => {
    return fireRequest('getConsultation', [id], {});
};
