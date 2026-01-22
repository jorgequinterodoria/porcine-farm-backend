import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/user.controller';
import { authenticate, isFarmAdminOrAbove } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(isFarmAdminOrAbove);

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
