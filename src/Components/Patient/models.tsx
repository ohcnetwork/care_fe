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
    countries_travelled?: string;
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
    fast_track?: number;
    flow?: Array<FlowModel>;
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
}
