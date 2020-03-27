export interface FacilityModal {
    id: number;
    name: string;
    district: string;
    facility_type: string;
    address: string;
    location: {
        latitude: number, longitude: number
    };
    oxygen_capacity: number;
    phone_number: string;
}

export interface CapacityModal {
    room_type: number;
    total_capacity: number;
    current_capacity: number;
}

export interface DoctorModal { 
    area: number; 
    count: number;
}