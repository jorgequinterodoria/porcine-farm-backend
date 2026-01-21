export interface CreateTaskDTO {
    title: string;
    description?: string;
    dueDate: Date;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    assignedToId?: string;
    facilityId?: string;
    penId?: string;
    animalId?: string;
    batchId?: string;
}

export interface UpdateTaskStatusDTO {
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export interface CreateNotificationDTO {
    userId: string;
    title: string;
    message: string;
    type: string;
}
