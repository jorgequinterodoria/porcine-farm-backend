import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler.middleware';
import { healthService } from '../services/health.service';

export class HealthController {
    // Catalogs
    getMedications = asyncHandler(async (req: Request, res: Response) => {
        const result = await healthService.getMedications();
        res.status(200).json({ success: true, data: result });
    });

    getVaccines = asyncHandler(async (req: Request, res: Response) => {
        const result = await healthService.getVaccines();
        res.status(200).json({ success: true, data: result });
    });

    getDiseases = asyncHandler(async (req: Request, res: Response) => {
        const result = await healthService.getDiseases();
        res.status(200).json({ success: true, data: result });
    });

    // Health Records
    createRecord = asyncHandler(async (req: Request, res: Response) => {
        const result = await healthService.createHealthRecord(req.user!.tenantId, req.body);
        res.status(201).json({ success: true, data: result });
    });

    getRecords = asyncHandler(async (req: Request, res: Response) => {
        const result = await healthService.getHealthRecords(req.user!.tenantId, req.query);
        res.status(200).json({ success: true, data: result });
    });

    getRecord = asyncHandler(async (req: Request, res: Response) => {
        const result = await healthService.findOneRecord(req.user!.tenantId, req.params.id as string);
        res.status(200).json({ success: true, data: result });
    });
}

export const healthController = new HealthController();
