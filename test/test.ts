import * as Logger from 'console';
import * as Joi from 'joi';

import * as Speedi from '../index';
import { speediConfig } from './config/speedi';

async function start(): Promise < void> {
    await Speedi.Config.initialize(speediConfig);

    const app = new Speedi.App({
        http: {
            host: 'localhost',
            port: 3002,
            protocol: 'http',
        },
        name: 'speedi-test',
    });

    app.addRoutes([
        {
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
            validate: {
                files: Joi.array().required(),
                headers: Joi.object().required(),
                res: Joi.object().required(),
                toId: Joi.string().required(),
            },
        },
    ]);

    app.run();
}

start();

async function sendFile(
    { files, headers, res, toId }:
    {files: any[], headers: string, res: any, toId: string },
): Promise<any> {
    res.send('test').end();
    return { v: files[0].buffer.toString(), headers, toId };
}
