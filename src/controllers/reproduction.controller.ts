import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler.middleware';
import { reproductionService } from '../services/reproduction.service';

export class ReproductionController {
    createBreeding = asyncHandler(async (req: Request, res: Response) => {
        const result = await reproductionService.createBreeding(req.user!.tenantId, req.body);
        res.status(201).json({ success: true, data: result });
    });

    getBreedingHistory = asyncHandler(async (req: Request, res: Response) => {
        const result = await reproductionService.getBreedingHistory(req.user!.tenantId, req.params.femaleId as string);
        res.status(200).json({ success: true, data: result });
    });

    createPregnancy = asyncHandler(async (req: Request, res: Response) => {
        const result = await reproductionService.createPregnancy(req.user!.tenantId, req.body);
        res.status(201).json({ success: true, data: result });
    });

    getPregnancies = asyncHandler(async (req: Request, res: Response) => {
        const result = await reproductionService.getPregnancies(req.user!.tenantId, req.query.animalId as string);
        res.status(200).json({ success: true, data: result });
    });

    createFarrowing = asyncHandler(async (req: Request, res: Response) => {
        const result = await reproductionService.createFarrowing(req.user!.tenantId, req.body);
        res.status(201).json({ success: true, data: result });
    });

    createWeaning = asyncHandler(async (req: Request, res: Response) => {
        const result = await reproductionService.createWeaning(req.user!.tenantId, req.body);
        res.status(201).json({ success: true, data: result });
    });
}

export const reproductionController = new ReproductionController();
