import { Router } from 'express';
import { healthController } from '../controllers/health.controller';
import { authenticate, isFarmAdminOrAbove } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { createHealthRecordSchema } from '../validators/health.validators';

const router = Router();

router.use(authenticate);

// Master catalogs
router.get('/medications', healthController.getMedications);
router.post('/medications', isFarmAdminOrAbove, healthController.createMedication);
router.put('/medications/:id', isFarmAdminOrAbove, healthController.updateMedication);
router.delete('/medications/:id', isFarmAdminOrAbove, healthController.deleteMedication);

router.get('/vaccines', healthController.getVaccines);
router.post('/vaccines', isFarmAdminOrAbove, healthController.createVaccine);
router.put('/vaccines/:id', isFarmAdminOrAbove, healthController.updateVaccine);
router.delete('/vaccines/:id', isFarmAdminOrAbove, healthController.deleteVaccine);

router.get('/diseases', healthController.getDiseases);
router.post('/diseases', isFarmAdminOrAbove, healthController.createDisease);
router.put('/diseases/:id', isFarmAdminOrAbove, healthController.updateDisease);
router.delete('/diseases/:id', isFarmAdminOrAbove, healthController.deleteDisease);

// Health Records
router.post('/records', validate(createHealthRecordSchema), healthController.createRecord);
router.get('/records', healthController.getRecords);
router.get('/records/:id', healthController.getRecord);

export default router;
