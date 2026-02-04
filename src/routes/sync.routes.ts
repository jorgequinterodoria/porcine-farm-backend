
import { Router } from 'express';
import { syncController } from '../controllers/sync.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();


router.use(authenticate);

/**
 * @swagger
 * /sync/pull:
 *   get:
 *     summary: Retrieve incremental changes for offline sync
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lastSyncAt
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Timestamp of the last successful sync
 *     responses:
 *       200:
 *         description: List of changes by model
 */
router.get('/pull', syncController.pull);

/**
 * @swagger
 * /sync/push:
 *   post:
 *     summary: Push offline changes to server
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               changes:
 *                 type: object
 *                 description: Map of model names to array of records
 *     responses:
 *       200:
 *         description: Result of sync operation
 */
router.post('/push', syncController.push);

export default router;
