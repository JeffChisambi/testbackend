import { Router } from 'express';
import * as ctrl from './ipcs.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { auditLog } from '../../middlewares/auditLog';
import { CreateIpcSchema, UpdateIpcSchema } from './ipcs.schema';

const router = Router();
router.use(authenticate);

router.get('/',    ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/',   authorize('admin'), auditLog('CREATE_IPC', 'Ipc'), validate(CreateIpcSchema), ctrl.create);
router.put('/:id', authorize('admin'), auditLog('UPDATE_IPC', 'Ipc'), validate(UpdateIpcSchema), ctrl.update);
router.delete('/:id', authorize('admin'), auditLog('DELETE_IPC', 'Ipc'), ctrl.remove);

export default router;
