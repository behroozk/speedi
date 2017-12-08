import * as express from 'express';
import * as jwt from 'jsonwebtoken';
import CONFIG from '../config/config';
import { ErrorHandler } from '../error/handler';
import { Logger } from '../logger/';
import { IAuthenticationOptions } from './options.interface';
import { IAuthenticationToken } from './token.interface';

export class Authentication {
    public static decode(encodedToken: string): Authentication | null {
        try {
            const verifiedToken = jwt.verify(encodedToken, CONFIG.app.secetKey) as IAuthenticationToken;

            if (!verifiedToken.issuedAt || !verifiedToken.lastAccess) {
                throw new Error('invalid token');
            }

            return new Authentication(verifiedToken);
        } catch (error) {
            Logger.error(error);
            return null;
        }
    }

    public static verify(options: IAuthenticationOptions): express.RequestHandler {
        return (req: express.Request, res: express.Response, next: express.NextFunction) => {
            const encodedToken = (req.get('Authorization') || '').split(' ')[1];
            const authentication = Authentication.decode(encodedToken);

            if (!authentication) {
                ErrorHandler.unauthorized(res);
            } else if (!authentication.rolesExist(options.roles)) {
                ErrorHandler.forbidden(res);
            } else if (!authentication.isTokenTimeValid()) {
                ErrorHandler.unauthorized(res, 'reauthentication required');
            } else if (options.customAuthenticator && !options.customAuthenticator(authentication.token)) {
                ErrorHandler.unauthorized(res, 'custom authentication failed');
            } else {
                if (options.renewToken) {
                    authentication.renewLastAccess();
                }

                res.locals.authenticationToken = authentication;
                next();
            }
        };
    }

    constructor(public token: IAuthenticationToken) { }

    public sign(): string {
        return jwt.sign(this.token, CONFIG.app.secetKey);
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
        return this.token.lastAccess + CONFIG.app.tokenLifeTime > Date.now();
    }
}
