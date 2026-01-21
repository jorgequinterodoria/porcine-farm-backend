export interface CreateAnimalDTO {
    internalCode: string;
    electronicId?: string;
    visualId?: string;
    breedId?: string;
    sex: 'male' | 'female';
    birthDate: string | Date;
    birthWeight?: number;
    motherId?: string;
    fatherId?: string;
    geneticLine?: string;
    currentStatus?: string;
    currentPenId?: string;
    entryDate?: string | Date;
    purpose?: string;
    origin?: string;
    acquisitionCost?: number;
    notes?: string;
    customFields?: any;
}

export interface UpdateAnimalDTO {
    internalCode?: string;
    electronicId?: string;
    visualId?: string;
    breedId?: string;
    sex?: 'male' | 'female';
    birthDate?: string | Date;
    birthWeight?: number;
    motherId?: string;
    fatherId?: string;
    geneticLine?: string;
    currentStatus?: string;
    currentPenId?: string;
    entryDate?: string | Date;
    purpose?: string;
    origin?: string;
    acquisitionCost?: number;
    notes?: string;
    customFields?: any;
    isActive?: boolean;
}

export interface RecordWeightDTO {
    weightKg: number;
    measurementDate: string | Date;
    notes?: string;
}

export interface RecordMovementDTO {
    movementType: string;
    fromPenId?: string;
    toPenId?: string;
    movementDate?: string | Date;
    reason?: string;
    notes?: string;
}

export interface AnimalResponse {
    id: string;
    internalCode: string;
    sex: string;
    birthDate: Date;
    currentStatus: string;
    currentPenId?: string;
    isActive: boolean;
    createdAt: Date;
}
