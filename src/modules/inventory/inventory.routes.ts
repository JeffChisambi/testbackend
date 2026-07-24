import { Router } from 'express';
import * as ctrl from './inventory.controller';
import { authenticate } from '../../middlewares/authenticate';

const router = Router();
router.use(authenticate);

router.get('/',           ctrl.list);
router.get('/low-stock',  ctrl.lowStock);
router.get('/movements',  ctrl.movements);

export default router;
