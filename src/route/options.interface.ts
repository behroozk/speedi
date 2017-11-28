import * as express from 'express';
import { IAuthenticationOptions } from '../authentication/options.interface';
import ICacherOptions from '../cacher/options.interface';
import { IPayloadValidatorOptions } from '../payload_validator/options.interface';
import { IRateLimiterOptions } from '../rate_limitter/options.interface';
import { RouteMethod } from './method.enum';

export interface IRouteOptions {
    description: string;
    method: RouteMethod;
    path: string;
    controller: express.RequestHandler;
    authentication?: IAuthenticationOptions;
    validate?: IPayloadValidatorOptions;
    rateLimit?: IRateLimiterOptions;
    cache?: ICacherOptions;
}
