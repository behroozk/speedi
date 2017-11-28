import * as express from 'express';

export interface IRateLimiterOptions {
    duration: number;
    allowedBeforeDelay: number;
    maximumDelay: number;
    allowedBeforeLimit: number;
    message?: string;
    keyGenerator?: (req: express.Request) => string;
}
