import { ErrorType } from './type.enum';

export class RequestError extends Error {
    public code: number;

    constructor(public message: string, public type: ErrorType, public metadata: any = {}) {
        super(message);
        this.code = type || 500;
    }
}
