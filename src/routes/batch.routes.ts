import { Router } from 'express';
import { batchController } from '../controllers/batch.controller';
import { validate } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { loadTenant } from '../middlewares/tenant.middleware';
import {
    createBatchSchema,
    updateBatchSchema,
    addBatchAnimalSchema,
    removeBatchAnimalSchema
} from '../validators/batch.validators';

const router = Router();

router.use(authenticate);
router.use(loadTenant);

router.post('/', validate(createBatchSchema), batchController.create);
router.get('/', batchController.getAll);
router.get('/:id', batchController.getOne);
router.put('/:id', validate(updateBatchSchema), batchController.update);

// Gestión de animales en el lote
router.post('/:id/animals', validate(addBatchAnimalSchema), batchController.addAnimal);
router.delete('/:id/animals', validate(removeBatchAnimalSchema), batchController.removeAnimal);

export default router;
