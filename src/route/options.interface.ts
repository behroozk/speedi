import * as express from 'express';
import { JSONSchema7 } from "json-schema";

import { IRateLimiterOptions } from '../rate_limiter/options.interface';
import { RouteMethod } from './method.enum';

export interface IRouteOptions {
    description: string;
    method: RouteMethod;
    path: string;
    controller: (...args: any[]) => Promise<any>;
    files?: boolean;
    middlewares?: ((request: express.Request, response: express.Response) => Promise<void>)[];
    payload?: (request: express.Request, response: express.Response) => any;
    schema?: JSONSchema7;
    rateLimit?: IRateLimiterOptions;
}
