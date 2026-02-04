import { Router } from 'express';
import { operationController } from '../controllers/operation.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { createTaskSchema, updateTaskStatusSchema } from '../validators/operations.validators';

const router = Router();

router.use(authenticate);


router.post('/tasks', validate(createTaskSchema), operationController.createTask);
router.get('/tasks', operationController.getTasks);
router.patch('/tasks/:id/status', validate(updateTaskStatusSchema), operationController.updateTask);


router.get('/notifications', operationController.getNotifications);

export default router;
