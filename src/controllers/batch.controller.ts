import { Request, Response } from 'express';
import { batchService } from '../services/batch.service';
import { asyncHandler } from '../middlewares/errorHandler.middleware';

export class BatchController {
    /**
     * @swagger
     * /batches:
     *   post:
     *     summary: Create a new batch
     *     tags: [Batches]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: ['code', 'name']
     *             properties:
     *               code:
     *                 type: string
     *               name:
     *                 type: string
     *               description:
     *                 type: string
     *     responses:
     *       201:
     *         description: Batch created successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Success'
     */
    create = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user!.tenantId;
        const batch = await batchService.create(tenantId, req.body);

        res.status(201).json({
            success: true,
            data: batch
        });
    });

    /**
     * @swagger
     * /batches:
     *   get:
     *     summary: Get all batches
     *     tags: [Batches]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of batches
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Success'
     */
    getAll = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user!.tenantId;
        const batches = await batchService.findAll(tenantId);

        res.status(200).json({
            success: true,
            data: batches
        });
    });

    /**
     * @swagger
     * /batches/{id}:
     *   get:
     *     summary: Get batch by ID
     *     tags: [Batches]
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
     *         description: Batch details
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Success'
     */
    getOne = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user!.tenantId;
        const batch = await batchService.findOne(tenantId, req.params.id as string);

        res.status(200).json({
            success: true,
            data: batch
        });
    });

    /**
     * @swagger
     * /batches/{id}:
     *   put:
     *     summary: Update batch details
     *     tags: [Batches]
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
     *         description: Batch updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Success'
     */
    update = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user!.tenantId;
        const batch = await batchService.update(tenantId, req.params.id as string, req.body);

        res.status(200).json({
            success: true,
            data: batch
        });
    });

    /**
     * @swagger
     * /batches/{id}/animals:
     *   post:
     *     summary: Add an animal to the batch
     *     tags: [Batches]
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
     *             required: ['animalId']
     *             properties:
     *               animalId:
     *                 type: string
     *                 format: uuid
     *     responses:
     *       201:
     *         description: Animal added to batch successfully
     */
    addAnimal = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user!.tenantId;
        const record = await batchService.addAnimal(tenantId, req.params.id as string, req.body);

        res.status(201).json({
            success: true,
            data: record
        });
    });

    /**
     * @swagger
     * /batches/{id}/animals:
     *   delete:
     *     summary: Remove an animal from the batch
     *     tags: [Batches]
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
     *             required: ['animalId']
     *             properties:
     *               animalId:
     *                 type: string
     *                 format: uuid
     *     responses:
     *       200:
     *         description: Animal removed from batch successfully
     */
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
