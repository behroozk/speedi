import { IConfig } from '../../index';

export const speediConfig: Partial<IConfig> = {
    amqp: {
        host: process.env.AMQP_HOST,
        password: process.env.AMQP_PASSWORD,
        port: Number(process.env.AMQP_PORT) || undefined,
        protocol: process.env.AMQP_PROTOCOL,
        username: process.env.AMQP_USERNAME,
    },
    app: {
        nodeEnv: process.env.NODE_ENV || 'development',
    },
    authentication: {
        secretKey: process.env.AUTH_SECRET_KEY,
        tokenLifeTime: Number(process.env.AUTH_TOKEN_LIFE_TIME) || undefined,
    },
    dataStore: {
        prefix: process.env.DATA_STORE_PREFIX || '',
        type: process.env.DATA_STORE_TYPE || 'redis',
    },
    redis: {
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
        port: Number(process.env.REDIS_PORT) || undefined,
        protocol: process.env.REDIS_PROTOCOL,
        username: process.env.REDIS_USERNAME,
    },
};
