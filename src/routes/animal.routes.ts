import { Router } from 'express';
import { animalController } from '../controllers/animal.controller';
import { validate } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { loadTenant, checkPlanLimits } from '../middlewares/tenant.middleware';
import {
    createAnimalSchema,
    updateAnimalSchema,
    recordWeightSchema,
    recordMovementSchema
} from '../validators/animal.validators';

const router = Router();

router.use(authenticate);
router.use(loadTenant);

router.post(
    '/',
    checkPlanLimits('animals'),
    validate(createAnimalSchema),
    animalController.create
);

router.get('/', animalController.getAll);
router.get('/:id', animalController.getOne);
router.put('/:id', validate(updateAnimalSchema), animalController.update);
router.delete('/:id', animalController.delete);

// Acciones especiales
router.post('/:id/weight', validate(recordWeightSchema), animalController.recordWeight);
router.post('/:id/movement', validate(recordMovementSchema), animalController.recordMovement);

export default router;
