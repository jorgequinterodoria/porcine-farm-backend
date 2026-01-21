import { Router } from 'express';
import { feedingController } from '../controllers/feeding.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import {
    createFeedTypeSchema,
    createFeedMovementSchema,
    createFeedConsumptionSchema
} from '../validators/feeding.validators';

const router = Router();

router.use(authenticate);

// Types
router.post('/types', validate(createFeedTypeSchema), feedingController.createType);
router.get('/types', feedingController.getTypes);

// Movements (Inventory)
router.post('/movements', validate(createFeedMovementSchema), feedingController.addMovement);

// Consumption
router.post('/consumption', validate(createFeedConsumptionSchema), feedingController.registerConsumption);
router.get('/consumption', feedingController.getConsumption);

export default router;
