import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler.middleware';
import { healthService } from '../services/health.service';

export class HealthController {
    // --- Medications ---
    /**
     * @swagger
     * /health/medications:
     *   get:
     *     summary: Get all medications
     *     tags: [Health]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of medications
     */
    getMedications = asyncHandler(async (req: Request, res: Response) => {
        const result = await healthService.getMedications();
        res.status(200).json({ success: true, data: result });
    });

    /**
     * @swagger
     * /health/medications:
     *   post:
     *     summary: Create a new medication
     *     tags: [Health]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: ['commercialName']
     *             properties:
     *               commercialName:
     *                 type: string
     *               activeIngredient:
     *                 type: string
     *     responses:
     *       201:
     *         description: Medication created
     */
    createMedication = asyncHandler(async (req: Request, res: Response) => {
        const result = await healthService.createMedication(req.body);
        res.status(201).json({ success: true, data: result });
    });

    /**
     * @swagger
     * /health/medications/{id}:
     *   put:
     *     summary: Update a medication
     *     tags: [Health]
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
     *               commercialName:
     *                 type: string
     *     responses:
     *       200:
     *         description: Medication updated
     */
    updateMedication = asyncHandler(async (req: Request, res: Response) => {
        const result = await healthService.updateMedication(req.params.id as string, req.body);
        res.status(200).json({ success: true, data: result });
    });

    /**
     * @swagger
     * /health/medications/{id}:
     *   delete:
     *     summary: Delete a medication
     *     tags: [Health]
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
     *         description: Medication deleted
     */
    deleteMedication = asyncHandler(async (req: Request, res: Response) => {
        await healthService.deleteMedication(req.params.id as string);
        res.status(200).json({ success: true, message: 'Medicamento eliminado correctamente' });
    });

    // --- Vaccines ---
    /**
     * @swagger
     * /health/vaccines:
     *   get:
     *     summary: Get all vaccines
     *     tags: [Health]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of vaccines
     */
    getVaccines = asyncHandler(async (req: Request, res: Response) => {
        const result = await healthService.getVaccines();
        res.status(200).json({ success: true, data: result });
    });

    /**
     * @swagger
     * /health/vaccines:
     *   post:
     *     summary: Create a new vaccine
     *     tags: [Health]
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
     *     responses:
     *       201:
     *         description: Vaccine created
     */
    createVaccine = asyncHandler(async (req: Request, res: Response) => {
        const result = await healthService.createVaccine(req.body);
        res.status(201).json({ success: true, data: result });
    });

    /**
     * @swagger
     * /health/vaccines/{id}:
     *   put:
     *     summary: Update a vaccine
     *     tags: [Health]
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
     *     responses:
     *       200:
     *         description: Vaccine updated
     */
    updateVaccine = asyncHandler(async (req: Request, res: Response) => {
        const result = await healthService.updateVaccine(req.params.id as string, req.body);
        res.status(200).json({ success: true, data: result });
    });

    /**
     * @swagger
     * /health/vaccines/{id}:
     *   delete:
     *     summary: Delete a vaccine
     *     tags: [Health]
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
     *         description: Vaccine deleted
     */
    deleteVaccine = asyncHandler(async (req: Request, res: Response) => {
        await healthService.deleteVaccine(req.params.id as string);
        res.status(200).json({ success: true, message: 'Vacuna eliminada correctamente' });
    });

    // --- Diseases ---
    /**
     * @swagger
     * /health/diseases:
     *   get:
     *     summary: Get all diseases
     *     tags: [Health]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of diseases
     */
    getDiseases = asyncHandler(async (req: Request, res: Response) => {
        const result = await healthService.getDiseases();
        res.status(200).json({ success: true, data: result });
    });

    /**
     * @swagger
     * /health/diseases:
     *   post:
     *     summary: Create a new disease
     *     tags: [Health]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: ['name', 'code']
     *             properties:
     *               name:
     *                 type: string
     *               code:
     *                 type: string
     *     responses:
     *       201:
     *         description: Disease created
     */
    createDisease = asyncHandler(async (req: Request, res: Response) => {
        const result = await healthService.createDisease(req.body);
        res.status(201).json({ success: true, data: result });
    });

    /**
     * @swagger
     * /health/diseases/{id}:
     *   put:
     *     summary: Update a disease
     *     tags: [Health]
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
     *     responses:
     *       200:
     *         description: Disease updated
     */
    updateDisease = asyncHandler(async (req: Request, res: Response) => {
        const result = await healthService.updateDisease(req.params.id as string, req.body);
        res.status(200).json({ success: true, data: result });
    });

    /**
     * @swagger
     * /health/diseases/{id}:
     *   delete:
     *     summary: Delete a disease
     *     tags: [Health]
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
     *         description: Disease deleted
     */
    deleteDisease = asyncHandler(async (req: Request, res: Response) => {
        await healthService.deleteDisease(req.params.id as string);
        res.status(200).json({ success: true, message: 'Enfermedad eliminada correctamente' });
    });

    // --- Health Records ---
    /**
     * @swagger
     * /health/records:
     *   post:
     *     summary: Create a health record
     *     tags: [Health]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: ['recordDate', 'type']
     *             properties:
     *               recordDate:
     *                 type: string
     *                 format: date
     *               type:
     *                 type: string
     *     responses:
     *       201:
     *         description: Health record created
     */
    createRecord = asyncHandler(async (req: Request, res: Response) => {
        const result = await healthService.createHealthRecord(req.user!.tenantId, req.body);
        res.status(201).json({ success: true, data: result });
    });

    /**
     * @swagger
     * /health/records:
     *   get:
     *     summary: Get health records
     *     tags: [Health]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: List of health records
     */
    getRecords = asyncHandler(async (req: Request, res: Response) => {
        const result = await healthService.getHealthRecords(req.user!.tenantId, req.query);
        res.status(200).json({ success: true, data: result });
    });

    /**
     * @swagger
     * /health/records/{id}:
     *   get:
     *     summary: Get a specific health record
     *     tags: [Health]
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
     *         description: Health record details
     */
    getRecord = asyncHandler(async (req: Request, res: Response) => {
        const result = await healthService.findOneRecord(req.user!.tenantId, req.params.id as string);
        res.status(200).json({ success: true, data: result });
    });
}

export const healthController = new HealthController();
