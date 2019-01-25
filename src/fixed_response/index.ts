import * as Express from 'express';

import { IFixedResponseMetadata } from './metadata.interface';
import { FixedResponseType } from './type.enum';

export class FixedResponse {
    public static redirect(path: string, status?: number): FixedResponse {
        return new FixedResponse(FixedResponseType.Redirect, { path, status });
    }

    constructor(private type: FixedResponseType, private metadata: IFixedResponseMetadata = {}) { }

    public express(res: Express.Response): boolean {
        if (this.type === FixedResponseType.Redirect) {
            if (!this.metadata.path) {
                return false;
            }

            const status: number = Number(this.metadata.status) || 302;

            res.redirect(status, this.metadata.path);

            return true;
        }

        return false;
    }
}
