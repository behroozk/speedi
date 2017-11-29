import * as express from 'express';
import * as jwt from 'jsonwebtoken';
import CONFIG from '../config/config';
import { ErrorHandler } from '../error_handler/';
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
            const token = Authentication.decode(encodedToken);

            if (!token) {
                ErrorHandler.unauthorized(res);
            } else if (!token.rolesExist(options.roles)) {
                ErrorHandler.forbidden(res);
            } else if (!token.isTokenTimeValid()) {
                ErrorHandler.unauthorized(res, 'reauthentication required');
            } else if (options.customAuthenticator && !options.customAuthenticator(token.data)) {
                ErrorHandler.unauthorized(res, 'custom authentication failed');
            } else {
                if (options.renewToken) {
                    token.renewLastAccess();
                }

                res.locals.authenticationToken = token;
                next();
            }
        };
    }

    constructor(private data: IAuthenticationToken) { }

    public sign(): string {
        return jwt.sign(this.data, CONFIG.app.secetKey);
    }

    public renewLastAccess(): Authentication {
        this.data.lastAccess = Date.now();
        return this;
    }

    public rolesExist(roles: string[]): boolean {
        if (!this.data.roles) {
            return false;
        }

        for (const role of roles) {
            if (this.data.roles.indexOf(role) < 0) { return false; }
        }

        return true;
    }

    public isTokenTimeValid(): boolean {
        return this.data.lastAccess + CONFIG.app.tokenLifeTime > Date.now();
    }
}
