import * as jwt from 'jsonwebtoken';

import { Config } from '../config/config';
import { RequestError } from '../error/request';
import { ErrorType } from '../error/type.enum';
import { Logger } from '../logger/';
import { IAuthenticationOptions } from './options.interface';

export class Authentication {
    public static decode(encodedToken: string): Authentication | null {
        try {
            const verifiedToken = jwt.verify(encodedToken, Config.authentication.secretKey);

            return new Authentication(verifiedToken);
        } catch (error) {
            Logger.error(error);
            return null;
        }
    }

    public static async verify(encodedToken: string, options: IAuthenticationOptions): Promise<Authentication> {
        const authentication: Authentication | null = Authentication.decode(encodedToken);

        if (!authentication) {
            throw new RequestError(ErrorType.Unauthorized);
        }

        const promises = options.authenticators.map((authenticator) => authenticator(authentication.token));

        const isAuthenticated = await Promise.all(promises);
        if (!isAuthenticated.every((auth) => auth)) {
            throw new RequestError(ErrorType.Unauthorized, 'authentication failed');
        }

        return authentication;
    }

    constructor(public token: any) { }

    public sign(): string {
        return jwt.sign(this.token, Config.authentication.secretKey);
    }
}
