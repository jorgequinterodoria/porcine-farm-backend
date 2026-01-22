import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler.middleware';
import { healthService } from '../services/health.service';

export class HealthController {
    // --- Medications ---
    getMedications = asyncHandler(async (req: Request, res: Response) => {
        const result = await healthService.getMedications();
        res.status(200).json({ success: true, data: result });
    });

    createMedication = asyncHandler(async (req: Request, res: Response) => {
        const result = await healthService.createMedication(req.body);
        res.status(201).json({ success: true, data: result });
    });

    updateMedication = asyncHandler(async (req: Request, res: Response) => {
        const result = await healthService.updateMedication(req.params.id as string, req.body);
        res.status(200).json({ success: true, data: result });
    });

    deleteMedication = asyncHandler(async (req: Request, res: Response) => {
        await healthService.deleteMedication(req.params.id as string);
        res.status(200).json({ success: true, message: 'Medicamento eliminado correctamente' });
    });

    // --- Vaccines ---
    getVaccines = asyncHandler(async (req: Request, res: Response) => {
        const result = await healthService.getVaccines();
        res.status(200).json({ success: true, data: result });
    });

    createVaccine = asyncHandler(async (req: Request, res: Response) => {
        const result = await healthService.createVaccine(req.body);
        res.status(201).json({ success: true, data: result });
    });

    updateVaccine = asyncHandler(async (req: Request, res: Response) => {
        const result = await healthService.updateVaccine(req.params.id as string, req.body);
        res.status(200).json({ success: true, data: result });
    });

    deleteVaccine = asyncHandler(async (req: Request, res: Response) => {
        await healthService.deleteVaccine(req.params.id as string);
        res.status(200).json({ success: true, message: 'Vacuna eliminada correctamente' });
    });

    // --- Diseases ---
    getDiseases = asyncHandler(async (req: Request, res: Response) => {
        const result = await healthService.getDiseases();
        res.status(200).json({ success: true, data: result });
    });

    createDisease = asyncHandler(async (req: Request, res: Response) => {
        const result = await healthService.createDisease(req.body);
        res.status(201).json({ success: true, data: result });
    });

    updateDisease = asyncHandler(async (req: Request, res: Response) => {
        const result = await healthService.updateDisease(req.params.id as string, req.body);
        res.status(200).json({ success: true, data: result });
    });

    deleteDisease = asyncHandler(async (req: Request, res: Response) => {
        await healthService.deleteDisease(req.params.id as string);
        res.status(200).json({ success: true, message: 'Enfermedad eliminada correctamente' });
    });

    // --- Health Records ---
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
