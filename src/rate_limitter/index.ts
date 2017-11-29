import * as express from 'express';
import { DataStore } from '../data_store/index';
import { ErrorHandler } from '../error_handler/';
import { IRateLimiterOptions } from './options.interface';

export class RateLimiter {
    public static setup({
        duration = 15 * 60,
        allowedBeforeDelay = 50,
        maximumDelay = 60 * 1000,
        allowedBeforeLimit = 100,
        message = 'Too many requests, please try again later',
        keyGenerator = (req: express.Request) => `ratelimit_${req.ip}_${req.method}_${req.originalUrl}`,
    }: IRateLimiterOptions): express.RequestHandler {
        return async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<any> => {
            const key = keyGenerator(req);

            try {
                const requests = await RateLimiter.dataStore.unshift(key, Date.now().toString());
                if (requests > allowedBeforeLimit) {
                    throw { limitExceeded: true };
                }

                // exponentially increasing wait time from 0 to maximumDelay
                // after reaching allowedBeforeDelay requests in duration seconds
                const overDelayLimit = Math.max(0, requests - allowedBeforeDelay);
                const waitTime = Math.round((maximumDelay / Math.pow(allowedBeforeLimit - allowedBeforeDelay, 2))
                    * Math.pow(overDelayLimit, 2));

                res.set('X-Rate-Limit-Limit', allowedBeforeLimit.toString());
                res.set('X-Rate-Limit-Remaining', (allowedBeforeLimit - requests).toString());
                res.set('X-Rate-Limit-Reset', duration.toString());
                setTimeout(() => {
                    res.set('X-Rate-Limit-Wait', Math.round(waitTime / 1000).toString());
                    next();
                }, waitTime);

                RateLimiter.dataStore.expire(key, duration);
            } catch (error) {
                if (!error.limitExceeded) {
                    return next();
                }

                const retryAfter = await RateLimiter.dataStore.ttl(key);
                ErrorHandler.tooManyRequests(res, message, { retryAfter });
            }
        };
    }

    private static dataStore = new DataStore('ratelimit');
}
