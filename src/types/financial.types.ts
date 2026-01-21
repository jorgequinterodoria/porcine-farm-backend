export interface CreateTransactionCategoryDTO {
    code: string;
    name: string;
    type: 'income' | 'expense';
    parentCategoryId?: string;
}

export interface CreateFinancialTransactionDTO {
    transactionDate: Date;
    transactionType: 'income' | 'expense';
    categoryId: string;
    amount: number;
    currency?: string;
    description: string;
    animalId?: string;
    batchId?: string;
    paymentMethod?: string;
    invoiceNumber?: string;
    supplierCustomer?: string;
    notes?: string;
}

export interface CreateAnimalSaleDTO {
    saleDate: Date;
    customerName: string;
    customerContact?: string;
    totalAmount: number;
    paymentStatus?: 'pending' | 'partially_paid' | 'paid';
    paymentMethod?: string;
    invoiceNumber?: string;
    notes?: string;
    details: {
        animalId: string;
        weightKg?: number;
        pricePerKg?: number;
        unitPrice?: number;
        subtotal: number;
    }[];
}
