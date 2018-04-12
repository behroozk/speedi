import * as express from 'express';

import { IRpcRequest } from '../rpc/request.interface';

export interface IRateLimiterOptions {
    waitTime: number;
    requestsAllowedBeforeDelay: number;
    maximumResponseDelay: number;
    requestsAllowedBeforeLimit: number;
    message?: string;
    keyGenerator?: (req: express.Request | IRpcRequest) => string;
    key: string;
}
