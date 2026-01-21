import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler.middleware';
import { financialService } from '../services/financial.service';

export class FinancialController {
    // Categories
    createCategory = asyncHandler(async (req: Request, res: Response) => {
        const result = await financialService.createCategory(req.user!.tenantId, req.body);
        res.status(201).json({ success: true, data: result });
    });

    getCategories = asyncHandler(async (req: Request, res: Response) => {
        const result = await financialService.getCategories(req.user!.tenantId);
        res.status(200).json({ success: true, data: result });
    });

    // Transactions
    createTransaction = asyncHandler(async (req: Request, res: Response) => {
        const result = await financialService.createTransaction(req.user!.tenantId, req.body, req.user!.id);
        res.status(201).json({ success: true, data: result });
    });

    getTransactions = asyncHandler(async (req: Request, res: Response) => {
        const result = await financialService.getTransactions(req.user!.tenantId, req.query);
        res.status(200).json({ success: true, data: result });
    });

    // Sales
    createSale = asyncHandler(async (req: Request, res: Response) => {
        const result = await financialService.createSale(req.user!.tenantId, req.body, req.user!.id);
        res.status(201).json({ success: true, data: result });
    });
}

export const financialController = new FinancialController();
