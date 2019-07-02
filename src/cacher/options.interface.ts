import * as Express from 'express';

export interface ICacherOptions {
    expire: number;
    authBased?: boolean;
    keyGenerator?: (req: Express.Request) => string;
}
