import { fireRequest } from "./fireRequest";

// User
export const postLogin = (params: object) => {
    return fireRequest('login', [], params);
};
export const getCurrentUser = () => {
    return fireRequest('currentUser');
};
export const signupUser = (params: object) => {
    return fireRequest("createUser", [], params)
};
export const addUser = (params: object) => {
    return fireRequest("addUser", [], params)
};


// Ambulance
export const postAmbulance = (params: object) => {
    return fireRequest('createAmbulance', [], params);
};
export const getAmbulanceList = (params: object) => {
    return fireRequest('listAmbulance', [] , params);
};

// Facility
export const createFacility = (params: object) => {
    return fireRequest("createFacility", [], params);
};
export const updateFacility = (id: number, params: object) => {
    return fireRequest('updateFacility', [id], params);
};
export const getUserList = (params: object) => {
    return fireRequest('userList', [], params);
};
export const getFacilities = (params: object) => {
    return fireRequest('listFacility', [], params);
};
export const getFacility = (id: number) => {
    return fireRequest('getFacility', [id], {});
};
export const readUser = (username: any) => {
    return fireRequest('readUser', [username], {});
};

// Capacity/Triage/Doctor
export const createCapacity = (id: number | undefined, params: object, pathParam: object) => {
    return id ? fireRequest('updateCapacity', [id], params, pathParam) : fireRequest("createCapacity", [], params, pathParam);
};
export const createDoctor = (id: number | undefined, params: object, pathParam: object) => {
    return id ? fireRequest('updateDoctor', [id], params, pathParam) : fireRequest("createDoctor", [], params, pathParam);
};
export const createTriageForm = (params: object ,pathParam:object) => {
    return fireRequest('createTriage', [], params, pathParam)
};
export const getTriageInfo = (pathParam: object) => {
    return fireRequest('getTriage', [], {},pathParam)
};
export const getTriageDetails = (id: number, pathParam: object) => {
    return fireRequest('getTriage', [id], {},pathParam)
};
export const listCapacity = (params: object, pathParam: object) => {
    return fireRequest('getCapacity', [], params, pathParam);
};
export const listDoctor = (params: object, pathParam: object) => {
    return fireRequest('getDoctor', [], params, pathParam);
};
export const getCapacity = (id: number, pathParam: object) => {
    return fireRequest('getCapacity', [id], {}, pathParam);
};
export const getDoctor = (id: number, pathParam: object) => {
    return fireRequest('getDoctor', [id], {}, pathParam);
};

//Patient
export const searchPatient = (params: object) => {
    return fireRequest('searchPatient', [], params);
};
export const getAllPatient = (params: object) => {
    return fireRequest('patientList', [], params);
};
export const createPatient = (params: object) => {
    return fireRequest('addPatient', [], params)
};
export const getPatient = (pathParam: object) => {
    return fireRequest('getPatient', [], {}, pathParam);
};
export const updatePatient = (params: object, pathParam: object) => {
    return fireRequest('updatePatient', [], params, pathParam)
};
export const transferPatient = (params: object, pathParam: object) => {
    return fireRequest('transferPatient', [], params, pathParam)
}
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
export const createSampleTest = (params: object, pathParam: object) => {
    return fireRequest('createSampleTest', [], params, pathParam)
};
export const getSampleTest = (id: number, pathParam: object) => {
    return fireRequest('getSampleTest', [id], {}, pathParam)
};

export const sampleReport = (pathParam: object) => {
    return fireRequest('sampleReport', [], {}, pathParam)
};

export const patchSampleTest = (id: number, params: object, pathParam: object) => {
    return fireRequest('patchSampleTest', [id], params, pathParam)
};
export const getTestList = (params: object) => {
    return fireRequest('getTestSampleList', [], params);
};
export const getTestSample = (id: number) => {
    return fireRequest('getTestSample', [id], {});
};
export const patchSample = (id: any, params: object) => {
    return fireRequest('patchSample', [id], params)
};

// Daily Rounds

export const createDailyReport = (params: object, pathParam: object) => {
    return fireRequest('createDailyRounds', [],  params, pathParam)
};
export const updateDailyReport = (params: object, pathParam: object) => {
    return fireRequest('updateDailyReport', [],  params, pathParam)
};
export const getDailyReport = (params: object, pathParam: object) => {
    return fireRequest('getDailyReports', [], params, pathParam)
};
export const getConsultationDailyRoundsDetails = (id: number, pathParam: object) => {
    return fireRequest('getDailyReports', [id], {}, pathParam);
};

// Consultation
export const createConsultation = (params: object) => {
    return fireRequest("createConsultation", [], params);
};
export const getConsultationList = (params: object) => {
    return fireRequest('getConsultationList', [], params);
};
export const getConsultation = (id: number) => {
    return fireRequest('getConsultation', [id], {});
};
export const updateConsultation = (id: number, params: object) => {
    return fireRequest("updateConsultation", [id], params);
};
