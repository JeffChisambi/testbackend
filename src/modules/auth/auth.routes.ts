import { Router } from 'express';
import { login, logout, refresh, me } from './auth.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authLimiter } from '../../middlewares/rateLimiter';
import { validate } from '../../middlewares/validate';
import { LoginSchema } from './auth.schema';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & token management
 */

/** @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and receive tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid credentials }
 */
router.post('/login', authLimiter, validate(LoginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);

export default router;
