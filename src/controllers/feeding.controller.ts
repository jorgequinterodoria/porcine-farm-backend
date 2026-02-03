import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler.middleware';
import { feedingService } from '../services/feeding.service';

export class FeedingController {
    // --- Feed Types ---
    /**
     * @swagger
     * /feeding/types:
     *   post:
     *     summary: Create a new feed type
     *     tags: [Feeding]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: ['name']
     *             properties:
     *               name:
     *                 type: string
     *               description:
     *                 type: string
     *               nutritionalInfo:
     *                 type: object
     *     responses:
     *       201:
     *         description: Feed type created
     */
    createType = asyncHandler(async (req: Request, res: Response) => {
        const result = await feedingService.createType(req.user!.tenantId, req.body);
        res.status(201).json({ success: true, data: result });
    });

    /**
     * @swagger
     * /feeding/types/{id}:
     *   put:
     *     summary: Update a feed type
     *     tags: [Feeding]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *               description:
     *                 type: string
     *     responses:
     *       200:
     *         description: Feed type updated
     */
    updateType = asyncHandler(async (req: Request, res: Response) => {
        const result = await feedingService.updateType(req.user!.tenantId, req.params.id as string, req.body);
        res.status(200).json({ success: true, data: result });
    });

    /**
     * @swagger
     * /feeding/types/{id}:
     *   delete:
     *     summary: Delete a feed type
     *     tags: [Feeding]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Feed type deleted
     */
    deleteType = asyncHandler(async (req: Request, res: Response) => {
        await feedingService.deleteType(req.user!.tenantId, req.params.id as string);
        res.status(200).json({ success: true, message: 'Tipo de alimento eliminado' });
    });

    /**
     * @swagger
     * /feeding/types:
     *   get:
     *     summary: Get all feed types
     *     tags: [Feeding]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of feed types
     */
    getTypes = asyncHandler(async (req: Request, res: Response) => {
        const result = await feedingService.getTypes(req.user!.tenantId);
        res.status(200).json({ success: true, data: result });
    });

    // --- Inventory Movements ---
    /**
     * @swagger
     * /feeding/inventory/movement:
     *   post:
     *     summary: Add inventory movement (In/Out)
     *     tags: [Feeding]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: ['feedTypeId', 'quantity', 'type']
     *             properties:
     *               feedTypeId:
     *                 type: string
     *                 format: uuid
     *               quantity:
     *                 type: number
     *               type:
     *                 type: string
     *                 enum: ['IN', 'OUT']
     *               cost:
     *                 type: number
     *     responses:
     *       201:
     *         description: Inventory movement recorded
     */
    addMovement = asyncHandler(async (req: Request, res: Response) => {
        const result = await feedingService.addMovement(req.user!.tenantId, req.body, req.user!.id);
        res.status(201).json({ success: true, data: result });
    });

    // --- Consumption ---
    /**
     * @swagger
     * /feeding/consumption:
     *   post:
     *     summary: Register feed consumption
     *     tags: [Feeding]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: ['batchId', 'feedTypeId', 'quantity']
     *             properties:
     *               batchId:
     *                 type: string
     *                 format: uuid
     *               feedTypeId:
     *                 type: string
     *                 format: uuid
     *               quantity:
     *                 type: number
     *     responses:
     *       201:
     *         description: Consumption registered
     */
    registerConsumption = asyncHandler(async (req: Request, res: Response) => {
        const result = await feedingService.registerConsumption(req.user!.tenantId, req.body, req.user!.id);
        res.status(201).json({ success: true, data: result });
    });

    /**
     * @swagger
     * /feeding/consumption:
     *   get:
     *     summary: Get consumption history
     *     tags: [Feeding]
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
     *     responses:
     *       200:
     *         description: Consumption history
     */
    getConsumption = asyncHandler(async (req: Request, res: Response) => {
        const result = await feedingService.getConsumptionHistory(req.user!.tenantId, req.query);
        res.status(200).json({ success: true, data: result });
    });

    // --- Alerts ---
    /**
     * @swagger
     * /feeding/alerts/low-stock:
     *   get:
     *     summary: Get low stock alerts
     *     tags: [Feeding]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of low stock items
     */
    getAlerts = asyncHandler(async (req: Request, res: Response) => {
        const result = await feedingService.getLowStockAlerts(req.user!.tenantId);
        res.status(200).json({ success: true, data: result });
    });
}

export const feedingController = new FeedingController();
