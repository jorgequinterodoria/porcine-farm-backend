import { Router } from 'express';
import { tenantController } from '../controllers/tenant.controller';
import { validate } from '../middlewares/validation.middleware';
import { authenticate, isSuperAdmin } from '../middlewares/auth.middleware';
import { createTenantSchema, updateTenantSchema } from '../validators/tenant.validators';

const router = Router();

// Todas las rutas de tenants requieren ser Super Admin
router.use(authenticate);
router.use(isSuperAdmin);

router.post('/', validate(createTenantSchema), tenantController.create);
router.get('/stats/global', tenantController.getGlobalStats);
router.get('/', tenantController.getAll);
router.get('/:id', tenantController.getOne);
router.put('/:id', validate(updateTenantSchema), tenantController.update);
router.delete('/:id', tenantController.delete);

export default router;
