export interface PatientModel {
    id?: number;
    name?: string;
    age?: number;
    gender?: number;
    phone_number?: string;
    medical_history?: Array<{ disease: string | number; details: string }>;
    contact_with_carrier?: boolean;
    medical_history_details?: string;
    is_active?: boolean;
    local_body_object?: { id: number; name: string; };
    district_object?: { id: number; name: string; };
    state_object?: { id: number; name: string; };
    tele_consultation_history?: Array<any>;
    address?: string;
    contact_with_confirmed_carrier?: boolean;
    contact_with_suspected_carrier?: boolean;
    estimated_contact_date?: string;
    past_travel?: boolean;
    countries_travelled?: string;
    present_health?: string;
    has_SARI?: boolean;
    local_body?: number;
    district?: number;
    state?: number;
}

export interface SampleTestModel {
    id?: number;
    status?: string;
    result?: string;
    notes?: string;
    date_of_sample?: string;
    date_of_result?: string;
    consultation?: number;
}

export interface DailyRoundsModel {
    temperature?: string;
    temperature_measured_at?: string;
    physical_examination_info?: string;
    other_details?: string;
    consultation?: number;
}