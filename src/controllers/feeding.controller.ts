import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler.middleware';
import { feedingService } from '../services/feeding.service';

export class FeedingController {
    createType = asyncHandler(async (req: Request, res: Response) => {
        const result = await feedingService.createType(req.user!.tenantId, req.body);
        res.status(201).json({ success: true, data: result });
    });

    getTypes = asyncHandler(async (req: Request, res: Response) => {
        const result = await feedingService.getTypes(req.user!.tenantId);
        res.status(200).json({ success: true, data: result });
    });

    addMovement = asyncHandler(async (req: Request, res: Response) => {
        const result = await feedingService.addMovement(req.user!.tenantId, req.body, req.user!.id);
        res.status(201).json({ success: true, data: result });
    });

    registerConsumption = asyncHandler(async (req: Request, res: Response) => {
        const result = await feedingService.registerConsumption(req.user!.tenantId, req.body, req.user!.id);
        res.status(201).json({ success: true, data: result });
    });

    getConsumption = asyncHandler(async (req: Request, res: Response) => {
        const result = await feedingService.getConsumptionHistory(req.user!.tenantId, req.query);
        res.status(200).json({ success: true, data: result });
    });
}

export const feedingController = new FeedingController();
