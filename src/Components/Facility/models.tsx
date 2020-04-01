export interface FacilityModal {
    id?: number;
    name?: string;
    district?: number;
    facility_type?: string;
    address?: string;
    location?: {
        latitude: number, longitude: number
    };
    oxygen_capacity?: number;
    phone_number?: string;
    local_body_object?: { name: string, body_type: number, localbody_code: string, district: number };
    district_object?: { id: number, name: string, state: number }
    state_object?: { id: number, name: string }
}

export interface CapacityModal {
    id?: number;
    room_type?: number;
    total_capacity?: number;
    current_capacity?: number;
}

export interface DoctorModal {
    id?: number;
    area?: number;
    count?: number;
}

export interface OptionsType {
    id: number;
    text: string;
    disabled?: boolean;
}
