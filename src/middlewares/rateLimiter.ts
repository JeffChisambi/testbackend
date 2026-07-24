import rateLimit from 'express-rate-limit';

/** Strict limiter for auth endpoints */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 min
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
});

/** Standard API limiter */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});

/** Sync endpoint limiter */
export const syncLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 min
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Sync rate limit reached. Retry in 1 minute.' },
});
