import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler.middleware';
import { facilityService } from '../services/facility.service';
import { penService } from '../services/pen.service';

export class InfrastructureController {
    // --- Facilities ---
    /**
     * @swagger
     * /infrastructure/facilities:
     *   post:
     *     summary: Create a new facility
     *     tags: [Infrastructure]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Facility'
     *     responses:
     *       201:
     *         description: Facility created
     */
    createFacility = asyncHandler(async (req: Request, res: Response) => {
        const result = await facilityService.create(req.user!.tenantId, req.body);
        res.status(201).json({ success: true, data: result });
    });

    /**
     * @swagger
     * /infrastructure/facilities:
     *   get:
     *     summary: Get all facilities
     *     tags: [Infrastructure]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of facilities
     */
    getFacilities = asyncHandler(async (req: Request, res: Response) => {
        const result = await facilityService.findAll(req.user!.tenantId);
        res.status(200).json({ success: true, data: result });
    });

    /**
     * @swagger
     * /infrastructure/facilities/{id}:
     *   get:
     *     summary: Get facility by ID
     *     tags: [Infrastructure]
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
     *         description: Facility details
     */
    getFacility = asyncHandler(async (req: Request, res: Response) => {
        const result = await facilityService.findOne(req.user!.tenantId, req.params.id as string);
        res.status(200).json({ success: true, data: result });
    });

    /**
     * @swagger
     * /infrastructure/facilities/{id}:
     *   put:
     *     summary: Update facility
     *     tags: [Infrastructure]
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
     *             $ref: '#/components/schemas/Facility'
     *     responses:
     *       200:
     *         description: Facility updated
     */
    updateFacility = asyncHandler(async (req: Request, res: Response) => {
        const result = await facilityService.update(req.user!.tenantId, req.params.id as string, req.body);
        res.status(200).json({ success: true, data: result });
    });

    /**
     * @swagger
     * /infrastructure/facilities/{id}:
     *   delete:
     *     summary: Delete facility
     *     tags: [Infrastructure]
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
     *         description: Facility deleted
     */
    deleteFacility = asyncHandler(async (req: Request, res: Response) => {
        await facilityService.delete(req.user!.tenantId, req.params.id as string);
        res.status(200).json({ success: true, message: 'Facility deleted successfully' });
    });

    // --- Pens ---
    /**
     * @swagger
     * /infrastructure/pens:
     *   post:
     *     summary: Create a new pen
     *     tags: [Infrastructure]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: ['facilityId', 'name', 'code', 'capacity']
     *             properties:
     *               facilityId:
     *                 type: string
     *                 format: uuid
     *               name:
     *                 type: string
     *               code:
     *                 type: string
     *               capacity:
     *                 type: integer
     *     responses:
     *       201:
     *         description: Pen created
     */
    createPen = asyncHandler(async (req: Request, res: Response) => {
        const result = await penService.create(req.user!.tenantId, req.body);
        res.status(201).json({ success: true, data: result });
    });

    /**
     * @swagger
     * /infrastructure/pens:
     *   get:
     *     summary: Get all pens
     *     tags: [Infrastructure]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: facilityId
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: List of pens
     */
    getPens = asyncHandler(async (req: Request, res: Response) => {
        const { facilityId } = req.query;
        const result = await penService.findAll(req.user!.tenantId, facilityId as string);
        res.status(200).json({ success: true, data: result });
    });

    /**
     * @swagger
     * /infrastructure/pens/{id}:
     *   get:
     *     summary: Get pen by ID
     *     tags: [Infrastructure]
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
     *         description: Pen details
     */
    getPen = asyncHandler(async (req: Request, res: Response) => {
        const result = await penService.findOne(req.user!.tenantId, req.params.id as string);
        res.status(200).json({ success: true, data: result });
    });

    /**
     * @swagger
     * /infrastructure/pens/{id}:
     *   put:
     *     summary: Update pen
     *     tags: [Infrastructure]
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
     *               capacity:
     *                 type: integer
     *     responses:
     *       200:
     *         description: Pen updated
     */
    updatePen = asyncHandler(async (req: Request, res: Response) => {
        const result = await penService.update(req.user!.tenantId, req.params.id as string, req.body);
        res.status(200).json({ success: true, data: result });
    });

    /**
     * @swagger
     * /infrastructure/pens/{id}:
     *   delete:
     *     summary: Delete pen
     *     tags: [Infrastructure]
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
     *         description: Pen deleted
     */
    deletePen = asyncHandler(async (req: Request, res: Response) => {
        await penService.delete(req.user!.tenantId, req.params.id as string);
        res.status(200).json({ success: true, message: 'Pen deleted successfully' });
    });
}

export const infrastructureController = new InfrastructureController();
