import { Router } from 'express';
import authRoutes from './auth.routes';
import tenantRoutes from './tenant.routes';
import animalRoutes from './animal.routes';
import batchRoutes from './batch.routes';
import infrastructureRoutes from './infrastructure.routes';
import healthRoutes from './health.routes';
import reproductionRoutes from './reproduction.routes';
import feedingRoutes from './feeding.routes';
import financialRoutes from './financial.routes';
import operationRoutes from './operation.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);
router.use('/animals', animalRoutes);
router.use('/batches', batchRoutes);
router.use('/infrastructure', infrastructureRoutes);
router.use('/health', healthRoutes);
router.use('/reproduction', reproductionRoutes);
router.use('/feeding', feedingRoutes);
router.use('/financial', financialRoutes);
router.use('/operations', operationRoutes);

// Aquí irán las demás rutas
// etc...

export default router;