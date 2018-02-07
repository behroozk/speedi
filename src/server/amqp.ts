import * as amqp from 'amqplib';
import * as Logger from 'console';

import { Config } from '../config/config';
import { IRouteOptions } from '../route/options.interface';
import { RpcRoute } from '../route/rpc';
import { IRpcRequest } from '../rpc/request.interface';
import { IServer } from './index.interface';
import { IRpcServerOptions } from './rpc_options.interface';

export class AmqpServer implements IServer {
    private connection: amqp.Connection | undefined;
    private channel: amqp.Channel | undefined;
    private stack: RpcRoute[] = [];

    constructor(private options: IRpcServerOptions) { }

    public async start(): Promise<boolean> {
        if (!this.connection) {
            this.connection = await amqp.connect({
                hostname: Config.amqp.host,
                password: Config.amqp.password,
                port: Config.amqp.port,
                protocol: Config.amqp.protocol,
                username: Config.amqp.username,
            });
        }

        if (!this.channel) {
            this.channel = await this.connection.createChannel();

            for (const queueName of this.options.queueNames) {
                this.channel.assertQueue(queueName, { durable: false });
                this.channel.prefetch(1);

                this.channel.consume(queueName, this.processMessage.bind(this));
                Logger.log(`listening to rpc queue ${queueName} ...`);
            }
        }

        return true;
    }

    public async stop(): Promise<boolean> {
        if (this.channel) {
            await this.channel.close();
            return true;
        }

        return false;
    }

    public addRoutes(routeObjects: IRouteOptions | IRouteOptions[]): void {
        if (Array.isArray(routeObjects)) {
            for (const routeObject of routeObjects) {
                this.stack.push(RpcRoute.generate(routeObject));
            }
        } else {
            this.stack.push(RpcRoute.generate(routeObjects));
        }
    }

    private async processMessage(message: amqp.Message | null): Promise<void> {
        if (!message) {
            return;
        }

        await this.start();
        if (!this.channel) {
            throw new Error('unable to connect to AMQP channel');
        }

        try {
            const requestData: IRpcRequest = JSON.parse(message.content.toString());

            for (const handler of this.stack) {
                const result = await handler.matchHandle(requestData);

                if (result) {
                    this.channel.sendToQueue(
                        message.properties.replyTo,
                        new Buffer(JSON.stringify(result)),
                        { correlationId: message.properties.correlationId },
                    );

                    this.channel.ack(message);
                    return;
                }
            }

            const errorMessage = `unknown request -> name: ${requestData.name}, ` +
                `method: ${requestData.method}, path: ${requestData.path}`;
            throw new Error(errorMessage);
        } catch (error) {
            Logger.error(error);
            this.channel.sendToQueue(
                message.properties.replyTo,
                new Buffer(JSON.stringify({
                    error: {
                        code: error.code,
                        message: error.message,
                        metadata: error.metadata,
                        stack: error.stack,
                        type: error.type,
                    },
                })),
                { correlationId: message.properties.correlationId },
            );

            this.channel.ack(message);
        }
    }
}
