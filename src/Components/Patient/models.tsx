export interface PatientModel {
    id?: number;
    name?: string;
    age?: number;
    gender?: number;
    phone_number?: string;
    medical_history?: Array<{ id: number }>;
    contact_with_carrier?: boolean;
    medical_history_details?: string;
    is_active?: boolean;
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