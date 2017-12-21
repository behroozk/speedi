import { IAuthenticationToken } from './token.interface';

export interface IAuthenticationOptions {
    customAuthenticator?: (token: IAuthenticationToken) => boolean;
    renewToken?: boolean;
    roles: string[];
}
