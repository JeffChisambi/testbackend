import { Router } from 'express';
import * as ctrl from './sync.controller';
import { authenticate } from '../../middlewares/authenticate';
import { syncLimiter } from '../../middlewares/rateLimiter';
import { validate } from '../../middlewares/validate';
import { SyncPushSchema } from './sync.schema';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Sync
 *   description: Mobile offline-first data synchronization
 */

/** POST /sync/push — mobile uploads offline-created farmers & purchases */
router.post('/push', syncLimiter, validate(SyncPushSchema), ctrl.push);
/** GET /sync/pull — mobile downloads master data + updates since timestamp */
router.get('/pull', ctrl.pull);
/** GET /sync/status — dashboard sync metrics */
router.get('/status', ctrl.status);
/** GET /sync/history — paginated sync log */
router.get('/history', ctrl.history);

export default router;
