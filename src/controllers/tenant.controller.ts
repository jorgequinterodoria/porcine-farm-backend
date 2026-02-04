import { Request, Response } from 'express';
import { tenantService } from '../services/tenant.service';
import { asyncHandler } from '../middlewares/errorHandler.middleware';

export class TenantController {
    



    create = asyncHandler(async (req: Request, res: Response) => {
        const result = await tenantService.createTenantWithAdmin(req.body);

        res.status(201).json({
            success: true,
            message: 'Tenant and Admin created successfully',
            data: result
        });
    });

    



    getGlobalStats = asyncHandler(async (req: Request, res: Response) => {
        const stats = await tenantService.getGlobalStats();

        res.status(200).json({
            success: true,
            data: stats
        });
    });

    



    getAll = asyncHandler(async (req: Request, res: Response) => {
        const tenants = await tenantService.findAll();

        res.status(200).json({
            success: true,
            data: tenants
        });
    });

    



    getOne = asyncHandler(async (req: Request, res: Response) => {
        const tenant = await tenantService.findOne(req.params.id as string);

        res.status(200).json({
            success: true,
            data: tenant
        });
    });

    



    update = asyncHandler(async (req: Request, res: Response) => {
        const tenant = await tenantService.update(req.params.id as string, req.body);

        res.status(200).json({
            success: true,
            message: 'Tenant updated successfully',
            data: tenant
        });
    });

    



    delete = asyncHandler(async (req: Request, res: Response) => {
        const result = await tenantService.delete(req.params.id as string);

        res.status(200).json({
            success: true,
            ...result
        });
    });
}

export const tenantController = new TenantController();
