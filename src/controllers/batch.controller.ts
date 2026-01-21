import { Request, Response } from 'express';
import { batchService } from '../services/batch.service';
import { asyncHandler } from '../middlewares/errorHandler.middleware';

export class BatchController {
    create = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user!.tenantId;
        const batch = await batchService.create(tenantId, req.body);

        res.status(201).json({
            success: true,
            data: batch
        });
    });

    getAll = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user!.tenantId;
        const batches = await batchService.findAll(tenantId);

        res.status(200).json({
            success: true,
            data: batches
        });
    });

    getOne = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user!.tenantId;
        const batch = await batchService.findOne(tenantId, req.params.id as string);

        res.status(200).json({
            success: true,
            data: batch
        });
    });

    update = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user!.tenantId;
        const batch = await batchService.update(tenantId, req.params.id as string, req.body);

        res.status(200).json({
            success: true,
            data: batch
        });
    });

    addAnimal = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user!.tenantId;
        const record = await batchService.addAnimal(tenantId, req.params.id as string, req.body);

        res.status(201).json({
            success: true,
            data: record
        });
    });

    removeAnimal = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user!.tenantId;
        const result = await batchService.removeAnimal(tenantId, req.params.id as string, req.body);

        res.status(200).json({
            success: true,
            ...result
        });
    });
}

export const batchController = new BatchController();
