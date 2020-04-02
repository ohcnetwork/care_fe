import { fireRequest } from "./fireRequest";

// User
export const postLogin = (form: object) => {
    return fireRequest('login', [], form);
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
export const getAmbulanceList = (paginate: object) => {
    return fireRequest('listAmbulance', [] , paginate);
};

// Facility
export const createFacility = (form: object) => {
    return fireRequest("createFacility", [], form);
};
export const updateFacility = (id: number, form: object) => {
    return fireRequest('updateFacility', [id], form);
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
export const createCapacity = (id: number | undefined, form: object, urlParam: object) => {
    return id ? fireRequest('updateCapacity', [id], form, urlParam) : fireRequest("createCapacity", [], form, urlParam);
};

export const createDoctor = (id: number | undefined, form: object, urlParam: object) => {
    return id ? fireRequest('updateDoctor', [id], form, urlParam) : fireRequest("createDoctor", [], form, urlParam);
};

export const createTriageForm = (data: object,urlParam:object) => {
    return fireRequest('createTriage', [], data, urlParam)
}

export const getTriageInfo = (urlParam:object) => {
    return fireRequest('getTriage', [], {}, urlParam)
}
export const listCapacity = (paginate: object, urlParam: object) => {
    return fireRequest('getCapacity', [], paginate, urlParam);
};

export const listDoctor = (paginate: object, urlParam: object) => {
    return fireRequest('getDoctor', [], paginate, urlParam);
};

export const getCapacity = (id: number, urlParam: object) => {
    return fireRequest('getCapacity', [id], {}, urlParam);
};

export const getDoctor = (id: number, urlParam: object) => {
    return fireRequest('getDoctor', [id], {}, urlParam);
};

export const getAllPatient = (paginate: object) => {
    return fireRequest('patientList', [], paginate);
};

export const createPatient = (form: object) => {
    return fireRequest('addPatient', [], form)
};
export const getPatient = (urlParam: object) => {
    return fireRequest('getPatient', [], {}, urlParam);
};
export const updatePatient = (form: object, urlParam: object) => {
    return fireRequest('updatePatient', [], form, urlParam)
};
export const getStates = () => {
    return fireRequest("statesList", [])
}
export const getDistricts = (urlParam: object) => {
    return fireRequest("districtsList", [], {}, urlParam)
}
export const getLocalBody = (urlParam: object) => {
    return fireRequest("localBodyList", [], {}, urlParam)
}
export const getDistrictByState = (urlParam: object) => {
    return fireRequest("getDistrictByState", [], {}, urlParam)
}
export const getLocalbodyByDistrict = (urlParam: object) => {
    return fireRequest("getLocalbodyByDistrict", [], {}, urlParam)
}
export const getSampleTestList = (params: object, urlParam: object) => {
    return fireRequest("sampleTestList", [], params, urlParam)
}

export const createSampleTest = (form: object, urlParam: object) => {
    return fireRequest('createSampleTest', [], form, urlParam)
};

export const getSampleTest = (id: number, urlParam: object) => {
    return fireRequest('getSampleTest', [id], {}, urlParam)
};
export const patchSampleTest = (id: number, form: object, urlParam: object) => {
    return fireRequest('patchSampleTest', [id], form, urlParam)
};

export const createConsultation = (form: object) => {
    return fireRequest("createConsultation", [], form);
};

export const getConsultationList = (params: object) => {
    return fireRequest('getConsultationList', [], params);
};

export const getConsultation = (urlParams: object) => {
    return fireRequest('getConsultation', [], {}, urlParams);
};

export const getTestList = (paginate: object) => {
    return fireRequest('getTestSampleList', [], paginate);
};

export const getTestSample = (id: number) => {
    return fireRequest('getTestSample', [id], {});
};

export const patchSample = (id: number, form: object) => {
    return fireRequest('patchSample', [id], form)
};
