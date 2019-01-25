import * as jwt from 'jsonwebtoken';

import { Config } from '../config/config';
import { RequestError } from '../error/request';
import { ErrorType } from '../error/type.enum';
import { Logger } from '../logger/';
import { IAuthenticationOptions } from './options.interface';

export function decode(encodedToken: string): string | object | null {
    try {
        const verifiedToken = jwt.verify(encodedToken, Config.authentication.secretKey);

        return verifiedToken;
    } catch (error) {
        Logger.error(error);
        return null;
    }
}

export async function verify(
    encodedToken: string | undefined,
    payload: any,
    options: IAuthenticationOptions,
): Promise<string | object> {
    if (!encodedToken) {
        throw new RequestError(ErrorType.Unauthorized);
    }

    const authentication: string | object | null = decode(encodedToken);

    if (!authentication) {
        throw new RequestError(ErrorType.Unauthorized);
    }

    const promises = options.authenticators.map((authenticator) => authenticator(authentication, payload));

    const isAuthenticated = await Promise.all(promises);
    if (!isAuthenticated.every((auth) => auth)) {
        throw new RequestError(ErrorType.Unauthorized, 'authentication failed');
    }

    return authentication;
}
