import * as http from 'http';

export interface ICacherOptions {
    expire: number;
    authBased?: boolean;
    keyGenerator?: (req: http.IncomingMessage) => string;
}
