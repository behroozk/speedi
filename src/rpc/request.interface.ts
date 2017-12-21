import { RouteMethod } from '../../index';
import { Authentication } from '../authentication/index';
import { IRpcResponse } from './response.interface';

export interface IRpcSenderRequest {
    service: string;
    name?: string;
    method?: RouteMethod;
    path?: string;
    authenticationToken?: string;
    payload?: any;
}

export interface IRpcRequest extends IRpcSenderRequest {
    ip?: string;
    originalUrl?: string;
    authentication?: Authentication;
    cacheResponseOptions?: {
        expire: number;
        key: string;
    };
    response: IRpcResponse;
}
