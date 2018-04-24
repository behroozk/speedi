import { DataStore } from '../data_store/index';
import { RequestError } from '../error/request';
import { ErrorType } from '../error/type.enum';
import { IRateLimiterOptions } from './options.interface';
import { IRateLimitterOutput } from './output.interface';

export class RateLimiter {
    public static async setup({
        waitTime = 15 * 60,
        requestsAllowedBeforeDelay = 50,
        maximumResponseDelay = 60 * 1000,
        requestsAllowedBeforeLimit = 100,
        message = 'Too many requests, please try again later',
        key,
    }: IRateLimiterOptions): Promise<IRateLimitterOutput | null> {
        if (!key) {
            return null;
        }

        if (!RateLimiter.dataStore) {
            RateLimiter.dataStore = new DataStore('ratelimit');
        }

        try {
            const requests = await RateLimiter.dataStore.unshift(key, Date.now().toString());
            if (requests > requestsAllowedBeforeLimit) {
                throw { limitExceeded: true };
            }

            // exponentially increasing response delay time from 0 to maximumDelay
            // after reaching allowedBeforeDelay requests in duration seconds
            const overDelayLimit = Math.max(0, requests - requestsAllowedBeforeDelay);
            const responseDelayTime =
                Math.round((maximumResponseDelay / Math.pow(requestsAllowedBeforeLimit - requestsAllowedBeforeDelay, 2))
                * Math.pow(overDelayLimit, 2));

            RateLimiter.dataStore.expire(key, waitTime);
            return await new Promise((resolve: (value: IRateLimitterOutput) => void) => {
                setTimeout(() => {
                    return resolve({
                        requests,
                        requestsAllowedBeforeLimit,
                        responseDelayTime,
                        waitTime,
                    });
                }, responseDelayTime);
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
