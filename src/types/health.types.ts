export interface CreateMedicationDTO {
    code: string;
    commercialName: string;
    genericName?: string;
    category?: string;
    presentation?: string;
    withdrawalPeriodDays?: number;
    dosageInstructions?: string;
    manufacturer?: string;
}

export interface CreateVaccineDTO {
    code: string;
    name: string;
    disease: string;
    type?: string;
    manufacturer?: string;
    applicationRoute?: string;
    dosage?: string;
    boosterRequired?: boolean;
    boosterIntervalDays?: number;
}

export interface CreateDiseaseDTO {
    code: string;
    name: string;
    scientificName?: string;
    category?: string;
    severity?: string;
    symptoms?: string;
    treatmentProtocol?: string;
    preventionMeasures?: string;
    isZoonotic?: boolean;
}

export interface CreateHealthRecordDTO {
    animalId?: string;
    batchId?: string;
    recordType: 'individual' | 'batch';
    recordDate?: Date;
    diseaseId?: string;
    symptoms?: string;
    diagnosis?: string;
    temperature?: number;
    treatmentPlan?: string;
    prognosis?: string;
    veterinarianId?: string;
    notes?: string;
}

export interface CreateMedicationTreatmentDTO {
    animalId?: string;
    batchId?: string;
    healthRecordId?: string;
    medicationId: string;
    startDate: Date;
    endDate?: Date;
    dosage?: string;
    frequency?: string;
    applicationRoute?: string;
    withdrawalDate?: Date;
    administeredBy?: string;
    notes?: string;
}
