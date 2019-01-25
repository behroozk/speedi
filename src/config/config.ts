import * as Joi from 'joi';

import { IConfig, IConfigApp, IConfigAuthentication, IConfigDataStore, IConfigRedis } from './index.interface';

export class Config {
    public static app: IConfigApp;
    public static authentication: IConfigAuthentication;
    public static dataStore: IConfigDataStore;
    public static redis: IConfigRedis;

    public static initialize(config: Partial<IConfig>): void {
        const result = Joi.validate(config, this.schema);

        if (result.error) {
            throw new Error(result.error.message);
        } else {
            const processedConfig: IConfig = result.value as IConfig;
            this.setConfig(processedConfig);
        }
    }

    private static schema: Joi.SchemaMap = {
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
        this.authentication = config.authentication as IConfigAuthentication;
        this.dataStore = config.dataStore as IConfigDataStore;
        this.redis = config.redis as IConfigRedis;
    }
}
