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

export interface BedType {
    id: number;
    text: string; 
    disabled: boolean;
}