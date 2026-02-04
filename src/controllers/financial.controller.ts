import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler.middleware';
import { financialService } from '../services/financial.service';

export class FinancialController {
    
    /**
     * @swagger
     * /financial/categories:
     *   post:
     *     summary: Create a financial category
     *     tags: [Financial]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: ['name', 'type']
     *             properties:
     *               name:
     *                 type: string
     *               type:
     *                 type: string
     *                 enum: ['income', 'expense']
     *     responses:
     *       201:
     *         description: Category created
     */
    createCategory = asyncHandler(async (req: Request, res: Response) => {
        const result = await financialService.createCategory(req.user!.tenantId, req.body);
        res.status(201).json({ success: true, data: result });
    });

    /**
     * @swagger
     * /financial/categories:
     *   get:
     *     summary: Get all financial categories
     *     tags: [Financial]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of categories
     */
    getCategories = asyncHandler(async (req: Request, res: Response) => {
        const result = await financialService.getCategories(req.user!.tenantId);
        res.status(200).json({ success: true, data: result });
    });

    
    /**
     * @swagger
     * /financial/transactions:
     *   post:
     *     summary: Create a transaction
     *     tags: [Financial]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: ['categoryId', 'amount', 'date', 'type']
     *             properties:
     *               categoryId:
     *                 type: string
     *                 format: uuid
     *               amount:
     *                 type: number
     *               date:
     *                 type: string
     *                 format: date
     *               type:
     *                 type: string
     *                 enum: ['income', 'expense']
     *               description:
     *                 type: string
     *     responses:
     *       201:
     *         description: Transaction created
     */
    createTransaction = asyncHandler(async (req: Request, res: Response) => {
        const result = await financialService.createTransaction(req.user!.tenantId, req.body, req.user!.id);
        res.status(201).json({ success: true, data: result });
    });

    /**
     * @swagger
     * /financial/transactions:
     *   get:
     *     summary: Get transactions
     *     tags: [Financial]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: startDate
     *         schema:
     *           type: string
     *           format: date
     *       - in: query
     *         name: endDate
     *         schema:
     *           type: string
     *           format: date
     *       - in: query
     *         name: type
     *         schema:
     *           type: string
     *           enum: ['income', 'expense']
     *     responses:
     *       200:
     *         description: List of transactions
     */
    getTransactions = asyncHandler(async (req: Request, res: Response) => {
        const result = await financialService.getTransactions(req.user!.tenantId, req.query);
        res.status(200).json({ success: true, data: result });
    });

    
    /**
     * @swagger
     * /financial/sales:
     *   post:
     *     summary: Register an animal sale
     *     tags: [Financial]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: ['clientName', 'saleDate', 'animals']
     *             properties:
     *               clientName:
     *                 type: string
     *               saleDate:
     *                 type: string
     *                 format: date
     *               animals:
     *                 type: array
     *                 items:
     *                   type: object
     *                   required: ['animalId', 'weight', 'pricePerKg']
     *                   properties:
     *                     animalId:
     *                       type: string
     *                       format: uuid
     *                     weight:
     *                       type: number
     *                     pricePerKg:
     *                       type: number
     *     responses:
     *       201:
     *         description: Sale registered
     */
    createSale = asyncHandler(async (req: Request, res: Response) => {
        const result = await financialService.createSale(req.user!.tenantId, req.body, req.user!.id);
        res.status(201).json({ success: true, data: result });
    });
}

export const financialController = new FinancialController();
