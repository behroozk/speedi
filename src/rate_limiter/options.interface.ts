import * as http from 'http';

export interface IRateLimiterOptions {
    waitTime: number;
    requestsAllowedBeforeDelay: number;
    maximumResponseDelay: number;
    requestsAllowedBeforeLimit: number;
    message?: string;
    keyGenerator?: (req: http.IncomingMessage) => string;
    key?: string;
}
