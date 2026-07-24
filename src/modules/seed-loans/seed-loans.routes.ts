import { Router } from 'express';
import * as ctrl from './seed-loans.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { auditLog } from '../../middlewares/auditLog';
import { IssueLoanSchema, RecordPaymentSchema } from './seed-loans.schema';

const router = Router();
router.use(authenticate);

router.get('/',    ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/',   authorize('admin', 'ipc_manager', 'extension_officer'), auditLog('ISSUE_LOAN', 'SeedLoan'), validate(IssueLoanSchema), ctrl.issue);
router.patch('/:id/payment',  validate(RecordPaymentSchema), ctrl.recordPayment);
router.patch('/:id/default',  authorize('admin', 'ipc_manager'), ctrl.markDefaulted);

export default router;
