import { IRpcOptions } from '../rpc/options.interface';

export interface IConfig {
    app: IConfigApp;
    authentication: IConfigAuthentication;
    amqp: IRpcOptions;
    dataStore: IConfigDataStore;
    redis: IConfigRedis;
}

export interface IConfigApp {
    host: string;
    port: number;
    name: string;
    nodeEnv?: string;
}

export interface IConfigAuthentication {
    secretKey: string;
    tokenLifeTime: number;
}

export interface IConfigDataStore {
    prefix: string;
    type: string;
}

export interface IConfigRedis {
    host: string;
    password: string;
    port: number;
    protocol: string;
    username: string;
}
