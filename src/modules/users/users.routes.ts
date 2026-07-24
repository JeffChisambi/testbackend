import { Router } from 'express';
import * as ctrl from './users.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { auditLog } from '../../middlewares/auditLog';
import { CreateUserSchema, UpdateUserSchema, ChangePasswordSchema } from './users.schema';

const router = Router();
router.use(authenticate);

/** @swagger
 * tags:
 *   name: Users
 *   description: User management (admin)
 */

router.get('/',    authorize('admin', 'headoffice_manager'), ctrl.list);
router.post('/',   authorize('admin'), auditLog('CREATE_USER', 'User'), validate(CreateUserSchema), ctrl.create);
router.get('/:id', authorize('admin', 'headoffice_manager', 'ipc_manager'), ctrl.getOne);
router.put('/:id', authorize('admin'), auditLog('UPDATE_USER', 'User'), validate(UpdateUserSchema), ctrl.update);
router.delete('/:id', authorize('admin'), auditLog('DELETE_USER', 'User'), ctrl.remove);
router.patch('/me/password', validate(ChangePasswordSchema), ctrl.changePassword);

export default router;
