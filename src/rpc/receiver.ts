import * as amqp from 'amqplib';
import * as Logger from 'console';
import { RequestError } from '../error/request';
import { IRouteOptions } from '../route/options.interface';
import { RpcHandler } from './handler';
import { IRpcOptions } from './options.interface';
import { IRpcRequest } from './request.interface';

export class RpcReceiver {
    private connection: amqp.Connection;
    private channel: amqp.Channel;
    private stack: RpcHandler[] = [];

    constructor(private options: IRpcOptions) { }

    public async initialize(): Promise<void> {
        this.connection = await amqp.connect({
            hostname: this.options.host,
            password: this.options.password,
            port: Number(this.options.port),
            protocol: this.options.protocol,
            username: this.options.username,
        });

        this.channel = await this.connection.createChannel();

        this.channel.assertQueue(this.options.queueName, { durable: false });
        this.channel.prefetch(1);

        this.channel.consume(this.options.queueName, this.processMessage.bind(this));
    }

    public addHandler(routeObject: IRouteOptions): void {
        const rpcHandler = RpcHandler.generate(routeObject);
        this.stack.push(rpcHandler);
    }

    private async processMessage(message: amqp.Message | null): Promise<void> {
        if (!message) {
            return;
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
