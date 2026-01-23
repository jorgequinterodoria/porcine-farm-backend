import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler.middleware';
import { feedingService } from '../services/feeding.service';

export class FeedingController {
    // --- Feed Types ---
    createType = asyncHandler(async (req: Request, res: Response) => {
        const result = await feedingService.createType(req.user!.tenantId, req.body);
        res.status(201).json({ success: true, data: result });
    });

    updateType = asyncHandler(async (req: Request, res: Response) => {
        const result = await feedingService.updateType(req.user!.tenantId, req.params.id as string, req.body);
        res.status(200).json({ success: true, data: result });
    });

    deleteType = asyncHandler(async (req: Request, res: Response) => {
        await feedingService.deleteType(req.user!.tenantId, req.params.id as string);
        res.status(200).json({ success: true, message: 'Tipo de alimento eliminado' });
    });

    getTypes = asyncHandler(async (req: Request, res: Response) => {
        const result = await feedingService.getTypes(req.user!.tenantId);
        res.status(200).json({ success: true, data: result });
    });

    // --- Inventory Movements ---
    addMovement = asyncHandler(async (req: Request, res: Response) => {
        const result = await feedingService.addMovement(req.user!.tenantId, req.body, req.user!.id);
        res.status(201).json({ success: true, data: result });
    });

    // --- Consumption ---
    registerConsumption = asyncHandler(async (req: Request, res: Response) => {
        const result = await feedingService.registerConsumption(req.user!.tenantId, req.body, req.user!.id);
        res.status(201).json({ success: true, data: result });
    });

    getConsumption = asyncHandler(async (req: Request, res: Response) => {
        const result = await feedingService.getConsumptionHistory(req.user!.tenantId, req.query);
        res.status(200).json({ success: true, data: result });
    });

    // --- Alerts ---
    getAlerts = asyncHandler(async (req: Request, res: Response) => {
        const result = await feedingService.getLowStockAlerts(req.user!.tenantId);
        res.status(200).json({ success: true, data: result });
    });
}

export const feedingController = new FeedingController();
