import * as express from 'express';
import { JSONSchema7 } from "json-schema";

import { IAuthenticationOptions } from '../authentication/options.interface';
import { ICacherOptions } from '../cacher/options.interface';
import { IRateLimiterOptions } from '../rate_limiter/options.interface';
import { RouteMethod } from './method.enum';

export interface IRouteOptions {
    description: string;
    method: RouteMethod;
    path: string;
    controller: (...args: any[]) => Promise<any>;
    authentication?: IAuthenticationOptions;
    files?: boolean;
    middlewares?: ((request: express.Request, response: express.Response) => Promise<void>)[];
    payload?: (request: express.Request, response: express.Response) => any;
    schema?: JSONSchema7;
    rateLimit?: IRateLimiterOptions;
    cache?: ICacherOptions;
}
