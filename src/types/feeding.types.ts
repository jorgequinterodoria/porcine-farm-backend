export interface CreateFeedTypeDTO {
    code: string;
    name: string;
    category?: string;
    proteinPercentage?: number;
    energyMcalKg?: number;
    crudeFiberPercentage?: number;
    formula?: string;
    manufacturer?: string;
    costPerKg?: number;
}

export interface FeedMovementDTO {
    feedTypeId: string;
    movementType: 'purchase' | 'adjustment' | 'transfer';
    quantityKg: number;
    movementDate: Date;
    unitCost?: number;
    totalCost?: number;
    supplier?: string;
    invoiceNumber?: string;
    notes?: string;
}

export interface CreateFeedConsumptionDTO {
    consumptionDate: Date;
    penId?: string;
    batchId?: string;
    animalId?: string;
    feedTypeId: string;
    quantityKg: number;
    numberOfAnimals?: number;
    notes?: string;
}
