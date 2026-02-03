import { Request, Response } from 'express';
import { animalService } from '../services/animal.service';
import { asyncHandler } from '../middlewares/errorHandler.middleware';

export class AnimalController {
  /**
   * @swagger
   * /animals:
   *   post:
   *     summary: Crear un nuevo animal
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
   *         description: Animal creado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Success'
   *       400:
   *         description: Datos inválidos
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: No autorizado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
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
   *     summary: Obtener todos los animales del tenant
   *     tags: [Animals]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, sold, deceased, quarantine, sick]
   *         description: Filtrar por estado del animal
   *       - in: query
   *         name: penId
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filtrar por corral específico
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Número de página
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: Límite de resultados por página
   *     responses:
   *       200:
   *         description: Lista de animales obtenida exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PaginatedResponse'
   *       401:
   *         description: No autorizado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
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
   *     summary: Obtener un animal específico
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
   *         description: ID del animal
   *     responses:
   *       200:
   *         description: Animal obtenido exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/Success'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Animal'
   *       404:
   *         description: Animal no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: No autorizado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
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
   *     summary: Actualizar un animal existente
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
   *         description: ID del animal a actualizar
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               internalCode:
   *                 type: string
   *                 description: Código interno del animal
   *               sex:
   *                 type: string
   *                 enum: [male, female]
   *                 description: Sexo del animal
   *               currentStatus:
   *                 type: string
   *                 enum: [active, sold, deceased, quarantine, sick]
   *                 description: Estado actual del animal
   *     responses:
   *       200:
   *         description: Animal actualizado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Success'
   *       404:
   *         description: Animal no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: No autorizado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
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
   *     summary: Eliminar un animal (soft delete)
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
   *         description: ID del animal a eliminar
   *     responses:
   *       200:
   *         description: Animal eliminado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Success'
   *       404:
   *         description: Animal no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: No autorizado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
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
   *     summary: Registrar peso de un animal
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
   *         description: ID del animal
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - weightKg
   *               - measurementDate
   *             properties:
   *               weightKg:
   *                 type: number
   *                 minimum: 0
   *                 description: Peso en kilogramos
   *               measurementDate:
   *                 type: string
   *                 format: date
   *                 description: Fecha de medición
   *               notes:
   *                 type: string
   *                 description: Notas adicionales
   *     responses:
   *       201:
   *         description: Peso registrado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Success'
   *       404:
   *         description: Animal no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: No autorizado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
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
   *     summary: Registrar movimiento de un animal
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
   *         description: ID del animal
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - movementType
   *             properties:
   *               movementType:
   *                 type: string
   *                 enum: [transfer, sale, death, medical]
   *                 description: Tipo de movimiento
   *               fromPenId:
   *                 type: string
   *                 format: uuid
   *                 description: ID del corral de origen
   *               toPenId:
   *                 type: string
   *                 format: uuid
   *                 description: ID del corral de destino
   *               movementDate:
   *                 type: string
   *                 format: date
   *                 description: Fecha del movimiento
   *               reason:
   *                 type: string
   *                 description: Razón del movimiento
   *               notes:
   *                 type: string
   *                 description: Notas adicionales
   *     responses:
   *       201:
   *         description: Movimiento registrado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Success'
   *       404:
   *         description: Animal no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: No autorizado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
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