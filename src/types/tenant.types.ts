export interface CreateTenantDTO {
    name: string;
    subdomain: string;
    email: string;
    phone?: string;
    address?: string;
    country?: string;
    stateProvince?: string;
    city?: string;
    subscriptionPlan?: string;
    maxAnimals?: number;
    maxUsers?: number;
    // Admin fields
    adminFirstName: string;
    adminLastName: string;
    adminEmail: string;
    adminPassword?: string; // If not provided, a random one should be generated
}

export interface UpdateTenantDTO {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    country?: string;
    stateProvince?: string;
    city?: string;
    subscriptionPlan?: string;
    subscriptionStatus?: string;
    maxAnimals?: number;
    maxUsers?: number;
    isActive?: boolean;
}

export interface TenantResponse {
    id: string;
    name: string;
    subdomain: string;
    email: string;
    subscriptionPlan: string;
    subscriptionStatus: string;
    isActive: boolean;
    createdAt: Date;
}
