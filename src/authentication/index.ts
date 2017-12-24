import * as jwt from 'jsonwebtoken';

import Config from '../config/config';
import { RequestError } from '../error/request';
import { ErrorType } from '../error/type.enum';
import { Logger } from '../logger/';
import { IAuthenticationOptions } from './options.interface';
import { IAuthenticationToken } from './token.interface';

export class Authentication {
    public static decode(encodedToken: string): Authentication | null {
        try {
            const verifiedToken = jwt.verify(encodedToken, Config.authentication.secretKey) as IAuthenticationToken;

            if (!verifiedToken.issuedAt || !verifiedToken.lastAccess) {
                throw new Error('invalid token');
            }

            return new Authentication(verifiedToken);
        } catch (error) {
            Logger.error(error);
            return null;
        }
    }

    public static verify(encodedToken: string, options: IAuthenticationOptions): Authentication {
        const authentication = Authentication.decode(encodedToken);

        if (!authentication) {
            throw new RequestError(ErrorType.Unauthorized);
        } else if (!authentication.rolesExist(options.roles)) {
            throw new RequestError(ErrorType.Forbidden);
        } else if (!authentication.isTokenTimeValid()) {
            throw new RequestError(ErrorType.Unauthorized, 'reauthentication required');
        } else if (options.customAuthenticator && !options.customAuthenticator(authentication.token)) {
            throw new RequestError(ErrorType.Unauthorized, 'custom authentication failed');
        }

        if (options.renewToken) {
            authentication.renewLastAccess();
        }

        return authentication;
    }

    constructor(public token: IAuthenticationToken) { }

    public sign(): string {
        return jwt.sign(this.token, Config.authentication.secretKey);
    }

    public renewLastAccess(): Authentication {
        this.token.lastAccess = Date.now();
        return this;
    }

    public rolesExist(roles: string[]): boolean {
        if (!this.token.roles) {
            return false;
        }

        for (const role of roles) {
            if (this.token.roles.indexOf(role) < 0) { return false; }
        }

        return true;
    }

    public isTokenTimeValid(): boolean {
        return this.token.lastAccess + Config.authentication.tokenLifeTime > Date.now();
    }
}
