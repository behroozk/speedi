export interface IConfig {
    app: Partial<IConfigApp>;
    authentication: Partial<IConfigAuthentication>;
    dataStore: Partial<IConfigDataStore>;
    redis: Partial<IConfigRedis>;
}

export interface IConfigApp {
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
