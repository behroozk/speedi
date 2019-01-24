import * as express from 'express';
import * as Joi from 'joi';

import { IAuthenticationOptions } from '../authentication/options.interface';
import { ICacherOptions } from '../cacher/options.interface';
import { IRateLimiterOptions } from '../rate_limiter/options.interface';
import { RouteMethod } from './method.enum';

export interface IRouteOptions {
    name: string;
    description: string;
    method: RouteMethod;
    path: string;
    controller: (...args: any[]) => Promise<any>;
    authentication?: IAuthenticationOptions;
    files?: boolean;
    payload?: (request: express.Request, response?: express.Response) => any;
    schema?: any;
    validate?: Joi.SchemaMap;
    rateLimit?: IRateLimiterOptions;
    cache?: ICacherOptions;
}
