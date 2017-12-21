import { STATUS_CODES } from 'http';

import { ErrorType } from './type.enum';

export class RequestError extends Error {
    public code: number;
    public type: ErrorType;
    public metadata: any;

    constructor(type: ErrorType, message?: string, metadata: any = {}) {
        const MESSAGE = message || STATUS_CODES[type] || '';
        super(MESSAGE);

        this.message = MESSAGE;
        this.type = type;
        this.metadata = metadata;
        this.code = type;
    }
}
