export interface PatientModal {
    id?: number;
    name?: string;
    age?: number;
    gender?: number;
    phone_number?: string;
    medical_history?: Array<{id:number}>;
    contact_with_carrier?: boolean;
    medical_history_details?: string;
    is_active?: boolean;
}