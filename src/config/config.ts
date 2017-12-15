import * as process from 'process';

const CONFIG = {
    amqp: {
        host: process.env.AMQP_HOST || '127.0.0.1',
        password: process.env.AMQP_PASSWORD || 'guest',
        port: process.env.AMQP_PORT || '5672',
        protocol: process.env.AMQP_PROTOCOL || 'amqp',
        queueName: process.env.AMQP_QUEUE || 'local_test_queue',
        username: process.env.AMQP_USERNAME || 'guest',
    },

    app: {
        host: process.env.SPEEDI_HOST || '127.0.0.1',
        port: process.env.SPEEDI_PORT || '9000',
        secetKey: process.env.SECRET_KEY || '',
        tokenLifeTime: 60 * 24 * 60 * 60 * 1000,
    },

    dataStore: {
        prefix: process.env.REDIS_PREFIX || '',
        type: process.env.DATA_STORE || 'redis',
    },

    nodeEnv: process.env.NODE_ENV || 'development',

    redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || '6379',
    },
};

export default CONFIG;
