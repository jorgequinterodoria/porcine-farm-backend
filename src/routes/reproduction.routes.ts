import { Router } from 'express';
import { reproductionController } from '../controllers/reproduction.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import {
    createBreedingSchema,
    createPregnancySchema,
    createFarrowingSchema,
    createWeaningSchema
} from '../validators/reproduction.validators';

const router = Router();

router.use(authenticate);

// Breeding
router.post('/breeding', validate(createBreedingSchema), reproductionController.createBreeding);
router.get('/breeding/:femaleId', reproductionController.getBreedingHistory);

// Pregnancy
router.post('/pregnancy', validate(createPregnancySchema), reproductionController.createPregnancy);
router.get('/pregnancy', reproductionController.getPregnancies);

// Farrowing
router.post('/farrowing', validate(createFarrowingSchema), reproductionController.createFarrowing);

// Weaning
router.post('/weaning', validate(createWeaningSchema), reproductionController.createWeaning);

export default router;
