export interface CreateBatchDTO {
    code: string;
    name: string;
    batchType: string;
    startDate: string | Date;
    expectedEndDate?: string | Date;
    initialCount?: number;
    targetWeight?: number;
    notes?: string;
}

export interface UpdateBatchDTO {
    code?: string;
    name?: string;
    batchType?: string;
    startDate?: string | Date;
    expectedEndDate?: string | Date;
    actualEndDate?: string | Date;
    currentCount?: number;
    targetWeight?: number;
    notes?: string;
    status?: string;
}

export interface BatchAnimalDTO {
    animalId: string;
    joinDate?: string | Date;
}

export interface RemoveBatchAnimalDTO {
    animalId: string;
    exitDate?: string | Date;
    exitReason?: string;
}
