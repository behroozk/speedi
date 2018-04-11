import * as Joi from 'joi';

import { IRpcOptions } from '../rpc/options.interface';
import { RpcSender } from '../rpc/sender';
import { IConfig, IConfigApp, IConfigAuthentication, IConfigDataStore, IConfigRedis } from './index.interface';

export class Config {
    public static app: IConfigApp;
    public static authentication: IConfigAuthentication;
    public static amqp: IRpcOptions;
    public static dataStore: IConfigDataStore;
    public static redis: IConfigRedis;

    public static async initialize(config: Partial<IConfig>): Promise<void> {
        const result = Joi.validate(config, this.schema);

        if (result.error) {
            throw new Error(result.error.message);
        } else {
            const processedConfig: IConfig = result.value as IConfig;
            this.setConfig(processedConfig);

            if (processedConfig.amqp) {
                await RpcSender.initialize(processedConfig.amqp as IRpcOptions);
            }
        }

        return;
    }

    private static schema: Joi.SchemaMap = {
        amqp: Joi.object({
            host: Joi.string().required(),
            password: Joi.string().optional().default('guest'),
            port: Joi.number().optional().default(5672),
            protocol: Joi.string().optional().default('amqp'),
            username: Joi.string().optional().default('guest'),
        }).optional(),
        app: Joi.object({
            nodeEnv: Joi.string().optional().default('development'),
        }).optional().default({
            nodeEnv: 'development',
        }),
        authentication: Joi.object({
            secretKey: Joi.string().required(),
            tokenLifeTime: Joi.number().optional().default(30 * 24 * 60 * 60 * 1000),
        }).required(),
        dataStore: Joi.object({
            prefix: Joi.string().empty('').optional().default(''),
            type: Joi.string().optional().default('redis'),
        }).optional().default({
            prefix: '',
            type: 'redis',
        }),
        redis: Joi.object({
            host: Joi.string().required(),
            password: Joi.string().empty('').optional().default(''),
            port: Joi.number().optional().default(6379),
            protocol: Joi.string().empty('').optional().default(''),
            username: Joi.string().empty('').optional().default(''),
        }).required(),
    };

    private static setConfig(config: IConfig): void {
        this.app = config.app;
        this.amqp = config.amqp as IRpcOptions;
        this.authentication = config.authentication as IConfigAuthentication;
        this.dataStore = config.dataStore as IConfigDataStore;
        this.redis = config.redis as IConfigRedis;
    }
}
