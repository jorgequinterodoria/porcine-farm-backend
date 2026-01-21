import { Router } from 'express';
import { financialController } from '../controllers/financial.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import {
    createTransactionCategorySchema,
    createFinancialTransactionSchema,
    createAnimalSaleSchema
} from '../validators/financial.validators';

const router = Router();

router.use(authenticate);

// Categories
router.post('/categories', validate(createTransactionCategorySchema), financialController.createCategory);
router.get('/categories', financialController.getCategories);

// Transactions
router.post('/transactions', validate(createFinancialTransactionSchema), financialController.createTransaction);
router.get('/transactions', financialController.getTransactions);

// Sales
router.post('/sales', validate(createAnimalSaleSchema), financialController.createSale);

export default router;
