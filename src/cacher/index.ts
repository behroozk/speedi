import * as express from 'express';
import { Authentication } from '../authentication/';
import { DataStore } from '../data_store/';
import { Logger } from '../logger/';
import { ICacherOptions } from './options.interface';
import { ICachedValue } from "./value.interface";

export class Cacher {
    public static retrieveOrCache({
        expire = 60,
        authBased = false,
    }: ICacherOptions): express.RequestHandler {
        return async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
            let key = `cache_${req.ip}_${req.method}_${req.originalUrl}`;

            if (authBased && res.locals.authentication) {
                const authentication: Authentication = res.locals.authentication;
                key += '_' + JSON.stringify(authentication.token);
            }

            try {
                const value = await Cacher.dataStore.get(key);

                if (!value) {
                    Cacher.replaceResponseSender(res);
                    Cacher.addResponseFinishListener(res, key, expire);
                    next();
                } else {
                    const cache = Cacher.parseCachedResponse(key, value);

                    if (cache instanceof Error) {
                        return next();
                    }

                    res.set('Content-Type', cache.header).send(cache.body).end();
                }
            } catch (error) {
                Logger.error(error);
                next();
            }
        };
    }

    private static dataStore = new DataStore('cache');

    private static replaceResponseSender(res: express.Response): void {
        const originalSend = res.send.bind(res);

        res.send = function send(body: any) {
            res.locals.body = body;
            return originalSend(body);
        };
    }

    private static addResponseFinishListener(res: express.Response, key: string, expire: number): void {
        res.on('finish', () => {
            if (res.statusCode === 200 && res.locals.body) {
                const cache: ICachedValue = {
                    body: res.locals.body,
                    header: res.get('Content-Type'),
                };

                Cacher.dataStore.set(key, JSON.stringify(cache));
                Cacher.dataStore.expire(key, expire);
            }
        });
    }

    private static parseCachedResponse(key: string, cahcedValue: string): ICachedValue | Error {
        let parsedCachedValue: ICachedValue;

        try {
            parsedCachedValue = JSON.parse(cahcedValue);
            return parsedCachedValue;
        } catch (e) {
            Cacher.dataStore.del(key);
        }

        throw new Error('invalid cache');
    }
}
