import { IAuthenticationToken } from './token.interface';

export interface IAuthenticationOptions {
    authenticator: (token: any) => Promise<boolean>;
}
