import * as express from 'express';
import { IRpcRequest } from '../rpc/request.interface';

export interface IRateLimiterOptions {
    duration: number;
    allowedBeforeDelay: number;
    maximumDelay: number;
    allowedBeforeLimit: number;
    message?: string;
    keyGenerator?: (req: express.Request | IRpcRequest) => string;
    key: string;
}
