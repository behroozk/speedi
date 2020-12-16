import { JSONSchema7 } from "json-schema";

import { validateJsonSchema } from '../payload';
import { IConfig, IConfigApp, IConfigAuthentication, IConfigDataStore, IConfigRedis } from './index.interface';

export class Config {
    public static app: IConfigApp;
    public static authentication: IConfigAuthentication;
    public static dataStore: IConfigDataStore;
    public static redis: IConfigRedis;

    public static initialize(config: Partial<IConfig>): void {
        const result: IConfig = validateJsonSchema(config, this.schema);

        this.setConfig(result);
    }

    private static schema: JSONSchema7 = {
        additionalProperties: false,
        properties: {
            app: {
                additionalProperties: false,
                properties: {
                    nodeEnv: { default: "development", type: "string" },
                },
                required: [],
                type: "object",
            },
            authentication: {
                additionalProperties: false,
                properties: {
                    secretKey: { minLength: 1, type: "string" },
                    tokenLifeTime: { default: 30 * 24 * 60 * 60 * 1000, type: "number" },
                },
                required: ["secretKey"],
                type: "object",
            },
            dataStore: {
                additionalProperties: false,
                properties: {
                    prefix: { default: "", type: "string" },
                    type: { default: "redis", type: "string" },
                },
                required: [],
                type: "object",
            },
            redis: {
                additionalProperties: false,
                properties: {
                    host: { minLength: 1, type: "string" },
                    password: { type: "string" },
                    port: { default: 6379, type: "number" },
                    protocol: { type: "string" },
                    username: { type: "string" },
                },
                required: ["host"],
                type: "object",
            },
        },
        required: [],
        type: "object",
    };

    private static setConfig(config: IConfig): void {
        this.app = config.app;
        this.authentication = config.authentication as IConfigAuthentication;
        this.dataStore = config.dataStore as IConfigDataStore;
        this.redis = config.redis as IConfigRedis;
    }
}
