import { Router } from 'express';
import * as ctrl from './farmers.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { auditLog } from '../../middlewares/auditLog';
import { CreateFarmerSchema, UpdateFarmerSchema } from './farmers.schema';

const router = Router();
router.use(authenticate);

router.get('/',    ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/',   auditLog('REGISTER_FARMER', 'Farmer'), validate(CreateFarmerSchema), ctrl.create);
router.put('/:id', auditLog('UPDATE_FARMER', 'Farmer'), validate(UpdateFarmerSchema), ctrl.update);
router.delete('/:id', authorize('admin', 'ipc_manager', 'headoffice_manager'), auditLog('DELETE_FARMER', 'Farmer'), ctrl.remove);

export default router;
