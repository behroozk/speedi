import * as Joi from 'joi';
import * as pathRegex from 'path-to-regexp';

import { Authentication } from '../authentication/index';
import { IAuthenticationOptions } from '../authentication/options.interface';
import { Cacher } from '../cacher/index';
import { ICacherOptions } from '../cacher/options.interface';
import { ICachedValue } from '../cacher/value.interface';
import { RequestError } from '../error/request';
import { Payload } from '../payload/index';
import { RateLimiter } from '../rate_limitter/index';
import { IRateLimiterOptions } from '../rate_limitter/options.interface';
import { IRouteOptions } from '../route/options.interface';
import { IRpcRequest } from '../rpc/request.interface';
import { IRpcResponse } from '../rpc/response.interface';

export class RpcRoute {
    public static generate(options: IRouteOptions): RpcRoute {
        const rpcHandler = new RpcRoute(options);

        return rpcHandler;
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

    private static authentication(options: IAuthenticationOptions): RpcMiddleware {
        return async (req: IRpcRequest): Promise<IRpcRequest> => {
            req.authentication = Authentication.verify(
                (req.authenticationToken || '').split(' ')[1],
                options,
            );

            return req;
        };
    }

    private static payloadSetup(): RpcMiddleware {
        return async (req: IRpcRequest): Promise<IRpcRequest> => {
            req.payload = req.payload || {};

            return req;
        };
    }

    private static payloadValidate(schema: Joi.SchemaMap): RpcMiddleware {
        return async (req: IRpcRequest): Promise<IRpcRequest> => {
            req.payload = Payload.validate(req.payload, schema);

            return req;
        };
    }

    private static rateLimiter(options: IRateLimiterOptions): RpcMiddleware {
        return async (req: IRpcRequest): Promise<IRpcRequest> => {
            options.key = options.keyGenerator ?
                options.keyGenerator(req) : `ratelimit_${req.ip}_${req.method}_${req.originalUrl}`;

            const result = await RateLimiter.setup(options);

            if (result &&
                !isNaN(result.requestsAllowedBeforeLimit) &&
                !isNaN(result.waitTime) &&
                !isNaN(result.requests) &&
                !isNaN(result.responseDelayTime)
            ) {
                req.response.headers['X-Rate-Limit-Limit'] = (result.requestsAllowedBeforeLimit).toString();
                req.response.headers['X-Rate-Limit-Remaining'] =
                    (result.requestsAllowedBeforeLimit - result.requests).toString();
                req.response.headers['X-Rate-Limit-Reset'] = result.waitTime.toString();
                req.response.headers['X-Rate-Limit-Wait'] = Math.round(result.responseDelayTime / 1000).toString();
            }

            return req;
        };
    }

    private static cacher(options: ICacherOptions): RpcMiddleware {
        return async (req: IRpcRequest): Promise<IRpcRequest> => {
            let key = `cache_${req.ip}_${req.method}_${req.originalUrl}`;

            if (options.authBased && req.authentication) {
                const authentication: Authentication = req.authentication;
                key += '_' + JSON.stringify(authentication.token);
            }

            const cachedResponse = await Cacher.retrieve(key);

            if (!cachedResponse) {
                req.cacheResponseOptions = { key, expire: options.expire };
            } else {
                req.response.headers['Content-Type'] = cachedResponse.header;
                req.response.body = cachedResponse.body;
            }

            return req;
        };
    }

    private static controller(fn: (args: any) => Promise<any>): RpcMiddleware {
        return async (req: IRpcRequest): Promise<IRpcRequest> => {
            req.response.body = await fn(req.payload);

            return req;
        };
    }

    private middlewares: RpcMiddleware[] = [];
    private pathRegExp: RegExp;
    private pathKeys: pathRegex.Key[] = [];

    constructor(private options: IRouteOptions) {
        this.pathRegExp = pathRegex(options.path, this.pathKeys);
        this.setupHandlers();
    }

    public match(requestData: IRpcRequest): IRpcRequest | null {

        if (requestData.path) {
            const matchDetails = this.pathRegExp.exec(requestData.path);

            if (matchDetails) {
                // add path parameters to payload object
                for (const [index, key] of this.pathKeys.entries()) {
                    requestData.payload[key.name] = matchDetails[index + 1];
                }

                return requestData;
            }
        } else if (requestData.name && requestData.name === this.options.name) {
            return requestData;
        }

        return null;
    }

    public async handle(requestData: IRpcRequest): Promise<IRpcResponse | null> {
        let result: IRpcRequest;
        requestData.response = {
            headers: {},
        };

        for (const middleware of this.middlewares) {
            result = await middleware(requestData);

            if (result.response.body) {
                if (result.cacheResponseOptions) {
                    const cache: ICachedValue = {
                        body: result.response.body,
                        header: 'application/json; charset=utf-8',
                    };

                    Cacher.store(result.cacheResponseOptions.key, cache, result.cacheResponseOptions.expire);
                }

                return result.response;
            }
        }

        return null;
    }

    public async matchHandle(requestData: IRpcRequest): Promise<IRpcResponse | null> {
        const matchedRequestData: IRpcRequest | null = this.match(requestData);

        if (matchedRequestData) {
            return await this.handle(matchedRequestData);
        }

        return null;
    }

    private setupHandlers(): void {
        if (this.options.authentication) {
            this.middlewares.push(RpcRoute.authentication(this.options.authentication));
        }

        this.middlewares.push(RpcRoute.payloadSetup());

        if (this.options.validate) {
            this.middlewares.push(RpcRoute.payloadValidate(this.options.validate));
        }

        if (this.options.rateLimit) {
            this.middlewares.push(RpcRoute.rateLimiter(this.options.rateLimit));
        }

        if (this.options.cache) {
            this.middlewares.push(RpcRoute.cacher(this.options.cache));
        }

        this.middlewares.push(RpcRoute.controller(this.options.controller));
    }
}

type RpcMiddleware = (args: any) => Promise<IRpcRequest>;
