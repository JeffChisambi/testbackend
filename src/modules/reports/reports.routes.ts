import { Router } from 'express';
import * as ctrl from './reports.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';

const router = Router();
router.use(authenticate, authorize('admin', 'ipc_manager', 'headoffice_manager', 'marketing_officer'));

router.get('/farmers',   ctrl.farmers);
router.get('/purchases', ctrl.purchases);
router.get('/loans',     ctrl.loans);
router.get('/inventory', ctrl.inventory);

export default router;
