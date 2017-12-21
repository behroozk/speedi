import { DataStore } from '../data_store/index';
import { RequestError } from '../error/request';
import { ErrorType } from '../error/type.enum';
import { IRateLimiterOptions } from './options.interface';
import { IRateLimitterOutput } from './output.interface';

export class RateLimiter {
    public static async setup({
        duration = 15 * 60,
        allowedBeforeDelay = 50,
        maximumDelay = 60 * 1000,
        allowedBeforeLimit = 100,
        message = 'Too many requests, please try again later',
        key,
    }: IRateLimiterOptions): Promise<IRateLimitterOutput | null> {
        if (!RateLimiter.dataStore) {
            RateLimiter.dataStore = new DataStore('ratelimit');
        }

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

            RateLimiter.dataStore.expire(key, duration);
            return await new Promise((resolve: (value: IRateLimitterOutput) => void, reject) => {
                setTimeout(() => {
                    return resolve({
                        allowedBeforeLimit,
                        duration,
                        requests,
                        waitTime,
                    });
                }, waitTime);
            });

        } catch (error) {
            if (!error.limitExceeded) {
                return null;
            }

            const retryAfter = await RateLimiter.dataStore.ttl(key);
            throw new RequestError(ErrorType.TooManyRequests, message, { retryAfter });
        }
    }

    private static dataStore: DataStore;
}
