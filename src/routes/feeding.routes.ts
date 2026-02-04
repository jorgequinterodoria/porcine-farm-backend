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


router.get('/types', feedingController.getTypes);
router.post('/types', isFarmAdminOrAbove, validate(createFeedTypeSchema), feedingController.createType);
router.put('/types/:id', isFarmAdminOrAbove, feedingController.updateType);
router.delete('/types/:id', isFarmAdminOrAbove, feedingController.deleteType);


router.post('/movements', isFarmAdminOrAbove, validate(createFeedMovementSchema), feedingController.addMovement);


router.post('/consumption', validate(createFeedConsumptionSchema), feedingController.registerConsumption);
router.get('/consumption', feedingController.getConsumption);


router.get('/alerts', feedingController.getAlerts);

export default router;
