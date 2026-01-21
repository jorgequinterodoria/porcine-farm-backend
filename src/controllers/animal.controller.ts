import { Request, Response } from 'express';
import { animalService } from '../services/animal.service';
import { asyncHandler } from '../middlewares/errorHandler.middleware';

export class AnimalController {
    create = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user!.tenantId;
        const animal = await animalService.create(tenantId, req.body);

        res.status(201).json({
            success: true,
            data: animal
        });
    });

    getAll = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user!.tenantId;
        const animals = await animalService.findAll(tenantId, req.query);

        res.status(200).json({
            success: true,
            data: animals
        });
    });

    getOne = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user!.tenantId;
        const animal = await animalService.findOne(tenantId, req.params.id as string);

        res.status(200).json({
            success: true,
            data: animal
        });
    });

    update = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user!.tenantId;
        const animal = await animalService.update(tenantId, req.params.id as string, req.body);

        res.status(200).json({
            success: true,
            data: animal
        });
    });

    delete = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user!.tenantId;
        const result = await animalService.delete(tenantId, req.params.id as string);

        res.status(200).json({
            success: true,
            ...result
        });
    });

    recordWeight = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user!.tenantId;
        const userId = req.user!.id;
        const record = await animalService.recordWeight(tenantId, req.params.id as string, userId, req.body);

        res.status(201).json({
            success: true,
            data: record
        });
    });

    recordMovement = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user!.tenantId;
        const userId = req.user!.id;
        const movement = await animalService.recordMovement(tenantId, req.params.id as string, userId, req.body);

        res.status(201).json({
            success: true,
            data: movement
        });
    });
}

export const animalController = new AnimalController();
