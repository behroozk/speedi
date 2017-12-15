import { RouteMethod } from '../../index';

export interface IRpcSenderRequest {
    service: string;
    name?: string;
    method?: RouteMethod;
    path?: string;
    authenticationToken?: string;
    payload?: any;
}
