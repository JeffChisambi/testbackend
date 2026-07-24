import { Router } from 'express';
import { list } from './audit.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';

const router = Router();
router.use(authenticate, authorize('admin', 'headoffice_manager'));

router.get('/', list);

export default router;
