import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler.middleware';
import { facilityService } from '../services/facility.service';
import { penService } from '../services/pen.service';

export class InfrastructureController {
    // --- Facilities ---
    createFacility = asyncHandler(async (req: Request, res: Response) => {
        const result = await facilityService.create(req.user!.tenantId, req.body);
        res.status(201).json({ success: true, data: result });
    });

    getFacilities = asyncHandler(async (req: Request, res: Response) => {
        const result = await facilityService.findAll(req.user!.tenantId);
        res.status(200).json({ success: true, data: result });
    });

    getFacility = asyncHandler(async (req: Request, res: Response) => {
        const result = await facilityService.findOne(req.user!.tenantId, req.params.id as string);
        res.status(200).json({ success: true, data: result });
    });

    updateFacility = asyncHandler(async (req: Request, res: Response) => {
        const result = await facilityService.update(req.user!.tenantId, req.params.id as string, req.body);
        res.status(200).json({ success: true, data: result });
    });

    deleteFacility = asyncHandler(async (req: Request, res: Response) => {
        await facilityService.delete(req.user!.tenantId, req.params.id as string);
        res.status(200).json({ success: true, message: 'Facility deleted successfully' });
    });

    // --- Pens ---
    createPen = asyncHandler(async (req: Request, res: Response) => {
        const result = await penService.create(req.user!.tenantId, req.body);
        res.status(201).json({ success: true, data: result });
    });

    getPens = asyncHandler(async (req: Request, res: Response) => {
        const { facilityId } = req.query;
        const result = await penService.findAll(req.user!.tenantId, facilityId as string);
        res.status(200).json({ success: true, data: result });
    });

    getPen = asyncHandler(async (req: Request, res: Response) => {
        const result = await penService.findOne(req.user!.tenantId, req.params.id as string);
        res.status(200).json({ success: true, data: result });
    });

    updatePen = asyncHandler(async (req: Request, res: Response) => {
        const result = await penService.update(req.user!.tenantId, req.params.id as string, req.body);
        res.status(200).json({ success: true, data: result });
    });

    deletePen = asyncHandler(async (req: Request, res: Response) => {
        await penService.delete(req.user!.tenantId, req.params.id as string);
        res.status(200).json({ success: true, message: 'Pen deleted successfully' });
    });
}

export const infrastructureController = new InfrastructureController();
