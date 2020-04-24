export interface FlowModel {
    id?: number;
    status?: string;
    created_date?: string;
    modified_date?: string;
    deleted?: boolean;
    notes?: string;
    patient_sample?: number;
    created_by?: number;
}

export interface PatientModel {
    id?: number;
    name?: string;
    age?: number;
    gender?: number;
    phone_number?: string;
    medical_history?: Array<{ disease: string | number; details: string }>;
    facility_object?: { id: number; name: string, facility_type?: { id: number; name: string } }
    contact_with_carrier?: boolean;
    medical_history_details?: string;
    is_active?: boolean;
    local_body_object?: { id: number; name: string; };
    district_object?: { id: number; name: string; };
    state_object?: { id: number; name: string; };
    tele_consultation_history?: Array<any>;
    last_consultation?: { id: number };
    address?: string;
    contact_with_confirmed_carrier?: boolean;
    contact_with_suspected_carrier?: boolean;
    is_medical_worker?: boolean;
    estimated_contact_date?: string;
    past_travel?: boolean;
    ongoing_medication?: string;
    countries_travelled?: Array<string> | string;
    present_health?: string;
    has_SARI?: boolean;
    local_body?: number;
    district?: number;
    state?: number;
    nationality?: string;
    passport_no?: string;
    disease_status?: string;
    date_of_birth?: string;
    blood_group?: string;
    number_of_aged_dependents?: number;
    number_of_chronic_diseased_dependents?: number;
}

export interface SampleTestModel {
    atypical_presentation?: string;
    diagnosis?: string;
    diff_diagnosis?: string;
    doctor_name?: string;
    etiology_identified?: string;
    has_ari?: boolean;
    has_sari?: boolean;
    is_atypical_presentation?: boolean;
    is_unusual_course?: boolean;
    sample_type?: string;
    sample_type_other?: string;
    id?: number;
    status?: string;
    result?: string;
    notes?: string;
    date_of_sample?: string;
    date_of_result?: string;
    consultation?: number;
    patient_name?: number;
    patient_has_sari?: boolean;
    patient_has_confirmed_contact?: boolean;
    patient_has_suspected_contact?: boolean;
    patient_travel_history?: string;
    facility?: number;
    facility_object?: { id: number; name: string, facility_type?: { id: number; name: string } }
    patient?: number;
    fast_track?: string;
    isFastTrack?: boolean;
    flow?: Array<FlowModel>;
}

export interface SampleReportModel {
    id?: number;
    personal_details?: {
        name?: string;
        gender?: string;
        age_years?: number;
        age_months?: number;
        date_of_birth?: string;
        phone_number?: string;
        email?: string;
        address?: string;
        pincode?: string;
        passport_no?: string;
        aadhar_no?: string;
        local_body_name?: string;
        district_name?: string;
        state_name?: string;
    }
    specimen_details?: {
        sample_type?: string;
        collection_type?: string;
        collection_date?: string;
        label?: string;
        is_repeated_sample?: boolean;
        lab_name?: string;
        lab_pincode?: string;
    }
    patient_category?: {
        symptomatic_international_traveller?: boolean;
        symptomatic_contact_of_confirmed_case?: boolean;
        symptomatic_healthcare_worker?: boolean;
        hospitalized_sari_patient?: boolean;
        asymptomatic_family_member_of_confirmed_case?: boolean;
        asymptomatic_healthcare_worker_without_protection?: boolean;
    }
    exposure_history?: {
        has_travel_to_foreign_last_14_days?: boolean;
        places_of_travel?: string;
        travel_start_date?: string;
        travel_end_date?: string;
        contact_with_confirmed_case?: boolean;
        contact_case_name?: string;
        was_quarantined?: boolean;
        quarantined_type?: string;
        healthcare_worker?: boolean;
    }
    medical_conditions?: {
        date_of_onset_of_symptoms?: string;
        symptoms?: Array<any>;
        has_sari?: boolean;
        has_ari?: boolean;
        medical_conditions?: Array<any>;
        hospitalization_date?: string;
        diagnosis?: string;
        diff_diagnosis?: string;
        etiology_identified?: string;
        is_atypical_presentation?: boolean;
        is_unusual_course?: boolean;
        hospital_phone_number?: string;
        hospital_name?: string;
        doctor_name?: string;
    }
}

export interface SampleListModel {
    id?: number;
    patient_name?: string;
    patient_has_sari?: boolean;
    patient_has_confirmed_contact?: boolean;
    patient_has_suspected_contact?: boolean;
    patient_travel_history?: string;
    facility?: number;
    facility_object?: { id: number; name: string, facility_type?: { id: number; name: string } }
    status?: string;
    result?: string;
    patient?: number;
    consultation?: number;
    date_of_sample?: string;
    date_of_result?: string;
    fast_track?: string;
}

export interface DailyRoundsModel {
    temperature?: string;
    temperature_measured_at?: string;
    physical_examination_info?: string;
    other_details?: string;
    consultation?: number;
    additional_symptoms?: Array<number>;
    additional_symptoms_text?: string;
    current_health?: string;
    id?: number;
    other_symptoms?: string;
    patient_category?: string;
    recommend_discharge?: boolean;
}
