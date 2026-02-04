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


router.post('/breeding', validate(createBreedingSchema), reproductionController.createBreeding);
router.get('/breeding/:femaleId', reproductionController.getBreedingHistory);


router.post('/pregnancy', validate(createPregnancySchema), reproductionController.createPregnancy);
router.get('/pregnancy', reproductionController.getPregnancies);


router.post('/farrowing', validate(createFarrowingSchema), reproductionController.createFarrowing);


router.post('/weaning', validate(createWeaningSchema), reproductionController.createWeaning);

export default router;
