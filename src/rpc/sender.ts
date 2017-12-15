import * as amqp from 'amqplib';
import * as Logger from 'console';
import * as uuid from 'uuid/v4';
import { Ip } from '../util/ip';
import { IRpcOptions } from './options.interface';
import { IRpcRequest } from './request.interface';
import { IRpcSenderRequest } from './sender_request.interface';

export class RpcSender {
    public static send({
        service,
        name,
        method,
        path,
        payload,
        authenticationToken,
    }: IRpcSenderRequest): Promise<any> {
        const id = uuid();

        if (!name && !(method || path)) {
            throw new Error('neither processor name nor method/path are set');
        }

        const request: IRpcRequest = {
            encodedAuthentication: authenticationToken,
            ip: Ip.get()[0].ip,
            method,
            name,
            path,
            payload: payload || {},
            response: {},
        };

        this.channel.sendToQueue(
            service,
            new Buffer(JSON.stringify(request)),
            {
                correlationId: id,
                replyTo: this.assertQueue.queue,
            },
        );

        return new Promise((resolve, reject) => {
            this.promises[id] = {
                reject,
                resolve,
                timestamp: Date.now(),
            };
        });
    }

    public static async initialize(options: IRpcOptions): Promise<void> {
        this.cleanupExpiredPromises();

        this.connection = await amqp.connect({
            hostname: options.host,
            password: options.password,
            port: Number(options.port),
            protocol: options.protocol,
            username: options.username,
        });

        this.channel = await this.connection.createChannel();

        this.assertQueue = await this.channel.assertQueue('', {
            exclusive: true,
        });

        this.channel.consume(this.assertQueue.queue, (message) => {
            if (!message) {
                return void (0);
            }

            let error = null;
            let response = null;
            const parsedMessage = JSON.parse(message.content.toString());
            if (parsedMessage.error) {
                error = parsedMessage.error;
            } else {
                response = parsedMessage;
            }

            if (this.promises[message.properties.correlationId]) {
                if (error) {
                    this.promises[message.properties.correlationId].reject(error);
                } else {
                    this.promises[message.properties.correlationId].resolve(response);
                }
                delete this.promises[message.properties.correlationId];
            } else {
                Logger.error(`message received with no callback: ${message.properties.correlationId}`);
            }
        }, {
                noAck: true,
            });
    }

    private static readonly PROMISE_LIFETIME = 10 * 60 * 1000;
    private static connection: amqp.Connection;
    private static channel: amqp.Channel;
    private static assertQueue: amqp.Replies.AssertQueue;
    private static promises: {
        [index: string]: {
            reject: (reason?: any) => void,
            resolve: (value?: any) => void,
            timestamp: number,
        },
    } = {};

    private static cleanupExpiredPromises(): void {
        Object.keys(this.promises).forEach((key) => {
            if (this.promises[key].timestamp + this.PROMISE_LIFETIME <= Date.now()) {
                this.promises[key].reject('timeout');
                delete this.promises[key];
            }
        });

        setTimeout(() => {
            this.cleanupExpiredPromises();
        }, this.PROMISE_LIFETIME);
    }
}
