import * as jwt from 'jsonwebtoken';

import { Config } from '../config/config';
import { RequestError } from '../error/request';
import { ErrorType } from '../error/type.enum';
import { Logger } from '../logger/';
import { IAuthenticationOptions } from './options.interface';

function decode(encodedToken: string): string | object | null {
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
    options: IAuthenticationOptions,
): Promise<[string | object, any]> {
    if (!encodedToken) {
        throw new RequestError(ErrorType.Unauthorized);
    }

    const decodedToken: string | object | null = decode(encodedToken);

    if (!decodedToken) {
        throw new RequestError(ErrorType.Unauthorized);
    }

    const payload: any = {};

    for (const authenticator of options.authenticators) {
        const isAuthenticated = await authenticator(decodedToken, payload);

        if (!isAuthenticated) {
            throw new RequestError(ErrorType.Unauthorized, 'authentication failed');
        }
    }

    return [decodedToken, payload];
}
