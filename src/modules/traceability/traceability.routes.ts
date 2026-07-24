import { Router } from 'express';
import { trace } from './traceability.controller';
import { authenticate } from '../../middlewares/authenticate';

const router = Router();
router.use(authenticate);

/** GET /traceability?query=<purchase_ref|grn_number|farmer_id|nrc_id|uuid> */
router.get('/', trace);

export default router;
