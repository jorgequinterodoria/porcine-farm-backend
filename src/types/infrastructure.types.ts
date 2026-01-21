export interface CreateFacilityDTO {
    code: string;
    name: string;
    facilityType: string;
    parentFacilityId?: string;
    capacity?: number;
    areaSqm?: number;
    description?: string;
    locationDescription?: string;
    coordinates?: string;
}

export interface UpdateFacilityDTO {
    name?: string;
    facilityType?: string;
    parentFacilityId?: string;
    capacity?: number;
    areaSqm?: number;
    description?: string;
    locationDescription?: string;
    coordinates?: string;
    isActive?: boolean;
}

export interface CreatePenDTO {
    facilityId: string;
    code: string;
    name: string;
    capacity: number;
    areaSqm?: number;
    hasFeeder?: boolean;
    hasWaterer?: boolean;
    hasClimateControl?: boolean;
    notes?: string;
}

export interface UpdatePenDTO {
    name?: string;
    capacity?: number;
    areaSqm?: number;
    hasFeeder?: boolean;
    hasWaterer?: boolean;
    hasClimateControl?: boolean;
    notes?: string;
    isActive?: boolean;
}
