export interface CreateBreedingServiceDTO {
    femaleId: string;
    serviceDate: Date;
    serviceType: 'natural' | 'ai' | 'other';
    maleId?: string;
    semenBatch?: string;
    semenProvider?: string;
    heatDetectionMethod?: string;
    technicianId?: string;
    notes?: string;
}

export interface CreatePregnancyDTO {
    animalId: string;
    breedingServiceId?: string;
    confirmationDate?: Date;
    confirmationMethod?: string;
    expectedFarrowingDate?: Date;
    notes?: string;
}

export interface CreateFarrowingDTO {
    pregnancyId: string;
    motherId: string;
    farrowingDate: Date;
    pigletsBornAlive: number;
    pigletsBornDead: number;
    pigletsMummified: number;
    totalLitterWeight?: number;
    averagePigletWeight?: number;
    assistanceRequired?: boolean;
    assistanceType?: string;
    complications?: string;
    attendedBy?: string;
    notes?: string;
}

export interface CreateWeaningDTO {
    farrowingId: string;
    weaningDate: Date;
    pigletsWeaned: number;
    averageWeaningWeight?: number;
    ageAtWeaningDays?: number;
    notes?: string;
    recordedBy?: string;
}
