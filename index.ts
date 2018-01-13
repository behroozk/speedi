import * as Logger from 'console';
import * as Joi from 'joi';

import { App } from './src/app/';
import { IAuthenticationOptions } from './src/authentication/options.interface';
import { ICacherOptions } from './src/cacher/options.interface';
import { Config } from './src/config/config';
import { IConfig } from './src/config/index.interface';
import { RequestError } from './src/error/request';
import { ErrorType } from './src/error/type.enum';
import { IRateLimiterOptions } from './src/rate_limitter/options.interface';
import { RouteMethod } from './src/route/method.enum';
import { IRouteOptions } from './src/route/options.interface';
import { RpcSender } from './src/rpc/sender';

// Config.init({
//     amqp: {
//         host: '127.0.0.1',
//     },
//     authentication: {
//         secretKey: 'abcdefg',
//     },
//     redis: {
//         host: '127.0.0.1',
//     },
// });

// const app = new App({
//     http: {
//         host: '127.0.0.1',
//         port: 9000,
//         protocol: 'http',
//     },
//     name: 'testApp',
//     rpc: {
//         queueNames: ['local_test_queue'],
//     },
// });

// app.addRoutes({
//     authentication: {
//         renewToken: true,
//         roles: ['user'],
//     },
//     cache: {
//         authBased: false,
//         expire: 10,
//     },
//     controller: async ({ id, name }) => {
//         return {
//             id,
//             message: `Hello ${name}!`,
//             timestamp: Date.now(),
//         };
//     },
//     description: 'Get user information',
//     method: RouteMethod.Post,
//     name: 'get_user',
//     path: '/user/:id',
//     payload: (req) => ({
//         id: req.params.id,
//         name: req.body.name,
//     }),
//     rateLimit: {
//         allowedBeforeDelay: 10,
//         allowedBeforeLimit: 20,
//         duration: 60,
//         key: '',
//         maximumDelay: 30 * 1000,
//     },
//     validate: {
//         id: Joi.string().required(),
//         name: Joi.string().required(),
//     },
// });

// setInterval(async () => {
//     let time = Date.now();
//     const response = await RpcSender.send({
//         authenticationToken: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlcyI6W' +
//             'yJ1c2VyIl0sIm5hbWUiOiJCZWhyb296IiwiaXNzdWVkQXQiOjE1MTE2NTI3MzUzOTYsImxhc3R' +
//             'BY2Nlc3MiOjE1MTE2NTI3MzUzOTYsImlhdCI6MTUxMTY1MjczNX0.59GW2tjJbUv8nXyA4kilT' +
//             'Crg0ofdyjjQbS1HEPr3xhM',
//         name: 'get_user',
//         payload: {
//             id: '123',
//             name: 'Dr. Farrokhvar',
//         },
//         service: 'local_test_queue',
//     });
//     time = Date.now() - time;
//     Logger.log(response, `in ${time}ms`);
// }, 5000);

// app.run();

export {
    App,
    Config,
    IAuthenticationOptions,
    ICacherOptions,
    IConfig,
    IRateLimiterOptions,
    IRouteOptions,
    RequestError,
    ErrorType,
    RouteMethod,
    RpcSender,
};
