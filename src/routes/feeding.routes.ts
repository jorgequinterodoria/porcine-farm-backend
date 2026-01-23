import { Router } from 'express';
import { feedingController } from '../controllers/feeding.controller';
import { authenticate, isFarmAdminOrAbove } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import {
    createFeedTypeSchema,
    createFeedMovementSchema,
    createFeedConsumptionSchema
} from '../validators/feeding.validators';

const router = Router();

router.use(authenticate);

// Types
router.get('/types', feedingController.getTypes);
router.post('/types', isFarmAdminOrAbove, validate(createFeedTypeSchema), feedingController.createType);
router.put('/types/:id', isFarmAdminOrAbove, feedingController.updateType);
router.delete('/types/:id', isFarmAdminOrAbove, feedingController.deleteType);

// Movements (Inventory)
router.post('/movements', isFarmAdminOrAbove, validate(createFeedMovementSchema), feedingController.addMovement);

// Consumption
router.post('/consumption', validate(createFeedConsumptionSchema), feedingController.registerConsumption);
router.get('/consumption', feedingController.getConsumption);

// Alerts
router.get('/alerts', feedingController.getAlerts);

export default router;
