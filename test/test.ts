import * as Speedi from '../index';
import { ServerType } from '../src/server/type.enum';
import { speediConfig } from './config/speedi';

function start(): void {
    Speedi.Config.initialize(speediConfig);

    const app = new Speedi.App({
        httpOptions: {
            allowedOrigins: [/\.supplyhub\.com$/],
            host: 'localhost',
            logRequests: true,
            port: 3002,
            protocol: 'http',
        },
        name: 'speedi-test',
        serverType: ServerType.Express,
    });

    app.addRoutes([
        {
            controller: sendFile,
            description: 'Send EDI documents through AS2',
            files: true,
            method: Speedi.RouteMethod.Post,
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
        },
        {
            controller: async ({ email }: { email: string }) => {
                return Speedi.FixedResponse.redirect(`http://www.supplyhub.com/${email}`, 300);
            },
            description: 'test route #2',
            method: Speedi.RouteMethod.Get,
            middlewares: [
                (req, res) => {
                    const email = req.query.email;
                    res.locals.email = email
                    throw new Error(email?.toString());
                },
            ],
            path: '/test2',
            payload: (req, res) => ({
                email: res.locals.email,
            }),
        },
        {
            controller: async ({ email, password }: { email: string, password: string }) => {
                return {
                    success: password === "test1234",
                    token: Buffer.from(`${email}:${password}`).toString("base64"),
                };
            },
            description: 'test route #3',
            method: Speedi.RouteMethod.Post,
            path: '/test3',
            payload: (req) => ({
                email: req.body.email,
                password: req.body.password,
            }),
            schema: {
                $schema: "http://json-schema.org/draft-07/schema#",
                additionalProperties: false,
                properties: {
                    email: {
                        format: "email",
                        minLength: 1,
                        type: "string",
                    },
                    password: { minLength: 1, type: "string" },
                },
                required: ["email", "password"],
            },
        },
    ]);

    app.start();
}

start();

async function sendFile(
    { files, headers, res, toId }:
        { files: any[], headers: string, res: any, toId: string },
): Promise<any> {
    res.send('test').end();
    return { v: files[0].buffer.toString(), headers, toId };
}
