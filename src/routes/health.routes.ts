import { Router } from 'express';
import { healthController } from '../controllers/health.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { createHealthRecordSchema } from '../validators/health.validators';

const router = Router();

// Master catalogs (Can be cached or public-ish within authenticated session)
router.use(authenticate);

router.get('/medications', healthController.getMedications);
router.get('/vaccines', healthController.getVaccines);
router.get('/diseases', healthController.getDiseases);

// Health Records
router.post('/records', validate(createHealthRecordSchema), healthController.createRecord);
router.get('/records', healthController.getRecords);
router.get('/records/:id', healthController.getRecord);

export default router;
