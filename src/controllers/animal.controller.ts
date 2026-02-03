import { Request, Response } from 'express';
import { animalService } from '../services/animal.service';
import { asyncHandler } from '../middlewares/errorHandler.middleware';

export class AnimalController {
    /**
     * @swagger
     * /animals:
     *   post:
     *     summary: Create a new animal
     *     tags: [Animals]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Animal'
     *     responses:
     *       201:
     *         description: Animal created successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Success'
     */
    create = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user!.tenantId;
        const animal = await animalService.create(tenantId, req.body);

        res.status(201).json({
            success: true,
            data: animal
        });
    });

    /**
     * @swagger
     * /animals:
     *   get:
     *     summary: Get all animals
     *     tags: [Animals]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *         description: Page number
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *         description: Items per page
     *     responses:
     *       200:
     *         description: List of animals
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/PaginatedResponse'
     */
    getAll = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user!.tenantId;
        const animals = await animalService.findAll(tenantId, req.query);

        res.status(200).json({
            success: true,
            data: animals
        });
    });

    /**
     * @swagger
     * /animals/{id}:
     *   get:
     *     summary: Get animal by ID
     *     tags: [Animals]
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
     *         description: Animal details
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Success'
     *       404:
     *         description: Animal not found
     */
    getOne = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user!.tenantId;
        const animal = await animalService.findOne(tenantId, req.params.id as string);

        res.status(200).json({
            success: true,
            data: animal
        });
    });

    /**
     * @swagger
     * /animals/{id}:
     *   put:
     *     summary: Update animal details
     *     tags: [Animals]
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
     *             $ref: '#/components/schemas/Animal'
     *     responses:
     *       200:
     *         description: Animal updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Success'
     */
    update = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user!.tenantId;
        const animal = await animalService.update(tenantId, req.params.id as string, req.body);

        res.status(200).json({
            success: true,
            data: animal
        });
    });

    /**
     * @swagger
     * /animals/{id}:
     *   delete:
     *     summary: Delete an animal (Soft delete)
     *     tags: [Animals]
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
     *         description: Animal deleted successfully
     */
    delete = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user!.tenantId;
        const result = await animalService.delete(tenantId, req.params.id as string);

        res.status(200).json({
            success: true,
            ...result
        });
    });

    /**
     * @swagger
     * /animals/{id}/weight:
     *   post:
     *     summary: Record animal weight
     *     tags: [Animals]
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
     *             required: ['weight', 'date']
     *             properties:
     *               weight:
     *                 type: number
     *               date:
     *                 type: string
     *                 format: date
     *     responses:
     *       201:
     *         description: Weight recorded successfully
     */
    recordWeight = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user!.tenantId;
        const userId = req.user!.id;
        const record = await animalService.recordWeight(tenantId, req.params.id as string, userId, req.body);

        res.status(201).json({
            success: true,
            data: record
        });
    });

    /**
     * @swagger
     * /animals/{id}/movement:
     *   post:
     *     summary: Move animal to another pen
     *     tags: [Animals]
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
     *             required: ['destinationPenId', 'date']
     *             properties:
     *               destinationPenId:
     *                 type: string
     *                 format: uuid
     *               date:
     *                 type: string
     *                 format: date
     *               reason:
     *                 type: string
     *     responses:
     *       201:
     *         description: Movement recorded successfully
     */
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
