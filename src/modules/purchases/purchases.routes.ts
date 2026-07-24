import { Router } from 'express';
import * as ctrl from './purchases.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { auditLog } from '../../middlewares/auditLog';
import { CreatePurchaseSchema } from './purchases.schema';

const router = Router();
router.use(authenticate);

router.get('/',                   ctrl.list);
router.get('/receipt/:ref',       ctrl.getByReceipt);
router.get('/:id',                ctrl.getOne);
router.post('/',  auditLog('RECORD_PURCHASE', 'Purchase'), validate(CreatePurchaseSchema), ctrl.create);
router.patch('/:id/cancel', authorize('admin', 'ipc_manager', 'headoffice_manager'), auditLog('CANCEL_PURCHASE', 'Purchase'), ctrl.cancel);

export default router;
