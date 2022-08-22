import Axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as express from 'express';
import { IncomingMessage } from 'http';
import * as Multer from 'multer';

import { DataStore } from '../data_store';
import { RequestError } from '../error/request';
import { FixedResponse } from '../fixed_response';
import { validateJsonSchema } from '../payload/index';
import { rateLimit } from '../rate_limiter/index';
import { IRateLimiterOptions } from '../rate_limiter/options.interface';
import { RouteMethod } from './method.enum';
import { IRouteOptions, RouteProxyOptions } from './options.interface';

export function generate(
    routeObjects: IRouteOptions | IRouteOptions[],
    rateLimitDataStore: DataStore,
): express.Router {
    const router = express.Router();

    if (!Array.isArray(routeObjects)) {
        return setupRoute(router, routeObjects, rateLimitDataStore);
    } else {
        for (const routeObject of routeObjects) {
            setupRoute(router, routeObject, rateLimitDataStore);
        }
    }

    return router;
}

function setupRoute(
    router: express.Router,
    routeObject: IRouteOptions,
    rateLimitDataStore: DataStore,
): express.Router {
    const middlewares: express.RequestHandler[] = [];

    if (routeObject.files) {
        middlewares.push(Multer().any());
    }

    if (routeObject.middlewares) {
        for (const middleware of routeObject.middlewares) {
            middlewares.push(runMiddleware(middleware));
        }
    }

    if (routeObject.payload) {
        middlewares.push(payloadSetup(routeObject.payload));
    }

    if (routeObject.schema) {
        middlewares.push(payloadValidatorJsonSchema(routeObject.schema));
    }

    if (routeObject.rateLimit) {
        middlewares.push(rateLimiter(routeObject.rateLimit, rateLimitDataStore));
    }

    const controller = routeObject.controller;
    if (routeObject.proxy && controller) {
        throw new Error('only one of proxy or controller should be set for a route');
    }

    if (!routeObject.proxy && !controller) {
        throw new Error('exactly one of proxy or controller should be set for routes');
    }

    if (controller) {
        middlewares.push(async (
            _: express.Request,
            res: express.Response,
            __: express.NextFunction,
        ): Promise<void> => {
            try {
                const controllerOutput: any = await controller(res.locals.payload);

                if (controllerOutput instanceof FixedResponse) {
                    controllerOutput.express(res);
                }

                // if controller already sent the response
                if (res.headersSent) {
                    return;
                }

                res
                    .json(controllerOutput)
                    .end();
                return;
            } catch (error: any) {
                const { statusCode, message, metadata } = extractErrorData(error);

                res.status(statusCode).send({ message, metadata }).end();
                return;
            }
        });
    }

    if (routeObject.proxy) {
        middlewares.push(setupProxy(routeObject.proxy));
    }

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

function extractErrorData(error: Error): { statusCode: number, code: string; message: string, metadata: any } {
    let statusCode: number = 500;
    let code: string = 'bad_request';
    const message = error.message;
    let metadata: any = {};

    if (error instanceof RequestError) {
        statusCode = error.code;
        metadata = error.metadata;
    }

    const anyError: any = error;

    if (anyError.statusCode) {
        statusCode = anyError.statusCode;
    }

    if (anyError.code) {
        code = anyError.code;
    }

    return { statusCode, code, message, metadata };
}

function runMiddleware(middlware: (req: express.Request, res: express.Response) => Promise<void>): express.RequestHandler {
    return async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
        try {
            await middlware(req, res);
            next();
        } catch (error: any) {
            const { statusCode, message, metadata } = extractErrorData(error);

            res.status(statusCode).send({ message, metadata }).end();
            return;
        }
    };
}

function payloadSetup(
    payloadGenerator: (request: express.Request, response: express.Response) => any,
): express.RequestHandler {
    return (req: express.Request, res: express.Response, next: express.NextFunction): void => {
        try {
            res.locals.payload = payloadGenerator(req, res);

            return next();
        } catch (error: any) {
            const { statusCode, message, metadata } = extractErrorData(error);

            res.status(statusCode).send({ message, metadata }).end();
            return;
        }
    };
}

function payloadValidatorJsonSchema(schema: any): express.RequestHandler {
    return (_: express.Request, res: express.Response, next: express.NextFunction): void => {
        try {
            res.locals.payload = validateJsonSchema(res.locals.payload, schema);

            return next();
        } catch (error: any) {
            const { statusCode, message, metadata } = extractErrorData(error);

            res.status(statusCode).send({ message, metadata }).end();
            return;
        }
    };
}

function rateLimiter(
    options: IRateLimiterOptions,
    rateLimitDataStore: DataStore,
): express.RequestHandler {
    return async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
        try {
            options.key = options.keyGenerator ?
                options.keyGenerator(req) : `ratelimit_${req.ip}_${req.method}_${req.originalUrl}`;

            const result = await rateLimit(options, rateLimitDataStore);

            if (result &&
                !isNaN(result.requestsAllowedBeforeLimit) &&
                !isNaN(result.waitTime) &&
                !isNaN(result.requests) &&
                !isNaN(result.responseDelayTime)
            ) {
                res.set('X-Rate-Limit-Limit', (result.requestsAllowedBeforeLimit).toString());
                res.set('X-Rate-Limit-Remaining', (result.requestsAllowedBeforeLimit - result.requests).toString());
                res.set('X-Rate-Limit-Reset', result.waitTime.toString());
                res.set('X-Rate-Limit-Wait', Math.round(result.responseDelayTime / 1000).toString());
            }

            return next();
        } catch (error: any) {
            const { statusCode, message, metadata } = extractErrorData(error);

            res.status(statusCode).send({ message, metadata }).end();
            return;
        }
    };
}

function setupProxy(proxyOptions: RouteProxyOptions): express.RequestHandler {
    return async (req: express.Request, res: express.Response, _: express.NextFunction): Promise<void> => {
        const options: AxiosRequestConfig = {
            method: proxyOptions.method,
            responseType: "stream",
            url: proxyOptions.url(req, res),
        };

        if (proxyOptions.headers) {
            options.headers = proxyOptions.headers(req, res);
        }

        if (proxyOptions.payload) {
            options.data = proxyOptions.payload(req, res);
        }

        try {
            const proxyRes = await Axios(options);

            setProxyResponse(proxyRes, res);
        } catch (error: any) {
            const errorResp: AxiosResponse<any> | undefined = error.response;
            if (errorResp) {
                setProxyResponse(errorResp, res);
            } else {
                res.status(500).send({ message: error.message }).end();
                return;
            }
        }
    };
}

function setProxyResponse(proxyRes: AxiosResponse<IncomingMessage>, res: express.Response) {
    Object.entries(proxyRes.headers || {})
        .forEach(([key, value]) => { res.setHeader(key, value as string) });

    res.status(proxyRes.status);

    proxyRes.data.pipe(res);
}
