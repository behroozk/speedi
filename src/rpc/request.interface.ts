import { RouteMethod } from '../../index';
import { Authentication } from '../authentication/index';
import { IRpcResponse } from './response.interface';

export interface IRpcRequest {
    name?: string;
    method?: RouteMethod;
    path?: string;
    ip?: string;
    originalUrl?: string;
    encodedAuthentication?: string;
    authentication?: Authentication;
    payload: any;
    cacheResponseOptions?: {
        expire: number;
        key: string;
    };
    response: IRpcResponse;
}
