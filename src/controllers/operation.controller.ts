import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler.middleware';
import { operationService } from '../services/operation.service';

export class OperationController {
    createTask = asyncHandler(async (req: Request, res: Response) => {
        const result = await operationService.createTask(req.user!.tenantId, req.body, req.user!.id);
        res.status(201).json({ success: true, data: result });
    });

    getTasks = asyncHandler(async (req: Request, res: Response) => {
        const result = await operationService.getTasks(req.user!.tenantId, req.query);
        res.status(200).json({ success: true, data: result });
    });

    updateTask = asyncHandler(async (req: Request, res: Response) => {
        const result = await operationService.updateTaskStatus(req.user!.tenantId, req.params.id as string, req.body);
        res.status(200).json({ success: true, data: result });
    });

    getNotifications = asyncHandler(async (req: Request, res: Response) => {
        const result = await operationService.getNotifications(req.user!.id);
        res.status(200).json({ success: true, data: result });
    });
}

export const operationController = new OperationController();
