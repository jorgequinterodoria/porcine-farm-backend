import { Router } from 'express';
import { infrastructureController } from '../controllers/infrastructure.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import {
    createFacilitySchema,
    updateFacilitySchema,
    createPenSchema,
    updatePenSchema
} from '../validators/infrastructure.validators';

const router = Router();

router.use(authenticate);

// Facilities
router.post('/facilities', validate(createFacilitySchema), infrastructureController.createFacility);
router.get('/facilities', infrastructureController.getFacilities);
router.get('/facilities/:id', infrastructureController.getFacility);
router.put('/facilities/:id', validate(updateFacilitySchema), infrastructureController.updateFacility);
router.delete('/facilities/:id', infrastructureController.deleteFacility);

// Pens
router.post('/pens', validate(createPenSchema), infrastructureController.createPen);
router.get('/pens', infrastructureController.getPens);
router.get('/pens/:id', infrastructureController.getPen);
router.put('/pens/:id', validate(updatePenSchema), infrastructureController.updatePen);
router.delete('/pens/:id', infrastructureController.deletePen);

export default router;
