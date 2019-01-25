import * as Logger from 'console';
import * as Joi from 'joi';

import * as Speedi from '../index';
import { ServerType } from '../src/server/type.enum';
import { speediConfig } from './config/speedi';

function start(): void {
    Speedi.Config.initialize(speediConfig);

    const app = new Speedi.App({
        httpOptions: {
            allowedOrigins: [/\.supplyhub\.com$/],
            host: 'localhost',
            port: 3002,
            protocol: 'http',
        },
        name: 'speedi-test',
        serverType: ServerType.Express,
    });

    app.addRoutes([
        {
            authentication: {
                authenticators: [
                    async (token: { test: number }, payload: any) => {
                        if (token.test) {
                            token.test = 1;
                            payload.blah = 2;
                        }
                        return true;
                    },
                ],
            },
            controller: sendFile,
            description: 'Send EDI documents through AS2',
            files: true,
            method: Speedi.RouteMethod.Post,
            name: 'sendFile',
            path: '/send/:toId',
            payload: (req, res) => ({
                files: req.files,
                headers: req.headers,
                res,
                toId: req.params.toId,
            }),
            schema: {
                $schema: 'http://json-schema.org/draft-07/schema#',
                properties: {
                    files: {
                        items: {
                            type: 'object',
                        },
                        type: 'array',
                    },
                    headers: {
                        type: 'object',
                    },
                    res: {
                        type: 'object',
                    },
                    toId: {
                        type: 'number',
                    },
                },
                required: ['files', 'toId'],
                title: 'send file schema',
                type: 'object',
            },
            validate: {
                files: Joi.array().required(),
                headers: Joi.object().required(),
                res: Joi.object().required(),
                toId: Joi.string().required(),
            },
        },
        {
            controller: async ({ email }: { email: string }) => {
                return Speedi.FixedResponse.redirect(`http://www.supplyhub.com`, 300);
            },
            description: 'test route #2',
            method: Speedi.RouteMethod.Post,
            name: 'test2',
            path: '/test2',
            payload: (req) => ({
                email: req.body.email,
            }),
            validate: {
                email: Joi.string().email().required(),
            },
        },
    ]);

    app.run();
}

start();

async function sendFile(
    { files, headers, res, toId }:
        { files: any[], headers: string, res: any, toId: string },
): Promise<any> {
    res.send('test').end();
    return { v: files[0].buffer.toString(), headers, toId };
}
