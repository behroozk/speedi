import * as express from 'express';
import * as Joi from 'joi';
import * as Multer from 'multer';

import { Authentication } from '../authentication/index';
import { IAuthenticationOptions } from '../authentication/options.interface';
import { Cacher } from '../cacher/index';
import { ICacherOptions } from '../cacher/options.interface';
import { ICachedValue } from '../cacher/value.interface';
import { RequestError } from '../error/request';
import { Payload } from '../payload/index';
import { RateLimiter } from '../rate_limitter/index';
import { IRateLimiterOptions } from '../rate_limitter/options.interface';
import { RouteMethod } from './method.enum';
import { IRouteOptions } from './options.interface';

export class RouteExpress {
    public static generate(routeObjects: IRouteOptions | IRouteOptions[]): express.Router {
        const router = express.Router();

        if (!Array.isArray(routeObjects)) {
            return this.setupRoute(router, routeObjects);
        } else {
            for (const routeObject of routeObjects) {
                this.setupRoute(router, routeObject);
            }
        }

        return router;
    }

    private static extractErrorData(error: Error): { status: number, message: string, metadata: any } {
        let status: number = 500;
        const message = error.message;
        let metadata: any = {};

        if (error instanceof RequestError) {
            status = error.code;
            metadata = error.metadata;
        }

        return { status, message, metadata };
    }

    private static authentication(options: IAuthenticationOptions): express.RequestHandler {
        return (req: express.Request, res: express.Response, next: express.NextFunction): void => {
            try {
                res.locals.authenticationToken = Authentication.verify(
                    (req.get('Authorization') || '').split(' ')[1],
                    options,
                );

                return next();
            } catch (error) {
                const { status, message, metadata } = RouteExpress.extractErrorData(error);

                return res.status(status).send({ message, metadata }).end();
            }
        };
    }

    private static payloadSetup(
        payloadGenerator: (request: express.Request, response: express.Response) => any,
    ): express.RequestHandler {
        return (req: express.Request, res: express.Response, next: express.NextFunction): void => {
            try {
                res.locals.payload = payloadGenerator(req, res);

                return next();
            } catch (error) {
                const { status, message, metadata } = RouteExpress.extractErrorData(error);

                return res.status(status).send({ message, metadata }).end();
            }
        };
    }

    private static payloadValidate(schema: Joi.SchemaMap): express.RequestHandler {
        return (req: express.Request, res: express.Response, next: express.NextFunction): void => {
            try {
                res.locals.payload = Payload.validate(res.locals.payload, schema);

                return next();
            } catch (error) {
                const { status, message, metadata } = RouteExpress.extractErrorData(error);

                return res.status(status).send({ message, metadata }).end();
            }
        };
    }

    private static rateLimiter(options: IRateLimiterOptions): express.RequestHandler {
        return async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
            try {
                options.key = options.keyGenerator ?
                    options.keyGenerator(req) : `ratelimit_${req.ip}_${req.method}_${req.originalUrl}`;

                const result = await RateLimiter.setup(options);

                if (result &&
                    !isNaN(result.allowedBeforeLimit) &&
                    !isNaN(result.duration) &&
                    !isNaN(result.requests) &&
                    !isNaN(result.waitTime)
                ) {
                    res.set('X-Rate-Limit-Limit', (result.allowedBeforeLimit).toString());
                    res.set('X-Rate-Limit-Remaining', (result.allowedBeforeLimit - result.requests).toString());
                    res.set('X-Rate-Limit-Reset', result.duration.toString());
                    res.set('X-Rate-Limit-Wait', Math.round(result.waitTime / 1000).toString());
                }

                return next();
            } catch (error) {
                const { status, message, metadata } = RouteExpress.extractErrorData(error);

                return res.status(status).send({ message, metadata }).end();
            }
        };
    }

    private static cacher(options: ICacherOptions): express.RequestHandler {
        return async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
            try {
                let key = `cache_${req.ip}_${req.method}_${req.originalUrl}`;

                if (options.authBased && res.locals.authentication) {
                    const authentication: Authentication = res.locals.authentication;
                    key += '_' + JSON.stringify(authentication.token);
                }

                const cachedResponse = await Cacher.retrieve(key);
                if (!cachedResponse) {
                    RouteExpress.storeResponse(res);
                    res.on('finish', () => {
                        if (res.statusCode === 200 && res.locals.body) {
                            const cache: ICachedValue = {
                                body: res.locals.body,
                                header: res.get('Content-Type'),
                            };

                            Cacher.store(key, cache, options.expire);
                        }
                    });
                    return next();
                } else {
                    return res.set('Content-Type', cachedResponse.header).send(cachedResponse.body).end();
                }
            } catch (error) {
                const { status, message, metadata } = RouteExpress.extractErrorData(error);

                return res.status(status).send({ message, metadata }).end();
            }
        };
    }

    private static storeResponse(res: express.Response): void {
        const originalSend = res.send.bind(res);

        res.send = function send(body: any) {
            res.locals.body = body;
            return originalSend(body);
        };
    }

    private static setupRoute(router: express.Router, routeObject: IRouteOptions): express.Router {
        const middlewares: express.RequestHandler[] = [];

        if (routeObject.authentication) {
            middlewares.push(this.authentication(routeObject.authentication));
        }

        if (routeObject.files) {
            middlewares.push(Multer().any());
        }

        if (routeObject.payload) {
            middlewares.push(this.payloadSetup(routeObject.payload));
        }

        if (routeObject.validate) {
            middlewares.push(this.payloadValidate(routeObject.validate));
        }

        if (routeObject.rateLimit) {
            middlewares.push(this.rateLimiter(routeObject.rateLimit));
        }

        if (routeObject.cache) {
            middlewares.push(this.cacher(routeObject.cache));
        }

        middlewares.push(async (
            req: express.Request,
            res: express.Response,
            next: express.NextFunction,
        ): Promise<void> => {
            try {
                const controllerOutput: any = await routeObject.controller.call(null, res.locals.payload);

                // if controller already sent the response
                if (res.headersSent) {
                    return;
                }

                return res
                    .json(controllerOutput)
                    .end();
            } catch (error) {
                const { status, message, metadata } = RouteExpress.extractErrorData(error);

                return res.status(status).send({ message, metadata }).end();
            }
        });

        switch (routeObject.method) {
            case RouteMethod.Get:
                router.get(routeObject.path, middlewares);
                break;
            case RouteMethod.Post:
                router.post(routeObject.path, middlewares);
                break;
            case RouteMethod.Put:
                router.put(routeObject.path, middlewares);
                break;
            case RouteMethod.Patch:
                router.patch(routeObject.path, middlewares);
                break;
            case RouteMethod.Delete:
                router.delete(routeObject.path, middlewares);
                break;
            default:
                throw new Error(`undefined route method: ${routeObject.method}`);
        }

        return router;
    }
}
