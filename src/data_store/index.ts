import { Config } from '../config/config';
import { Logger } from '../logger/';
import { IDataStoreClient } from './client.interface';
import { RedisClient } from './redis';

export class DataStore {
    private client: IDataStoreClient;

    private prefix: string;

    constructor(namespace = '') {
        this.prefix =
            (Config.dataStore.prefix ? `${Config.dataStore.prefix}_` : '') +
            (namespace ? `${namespace}_` : '');

        if (Config.dataStore.type === 'redis') {
            this.client = new RedisClient();
        } else {
            Logger.error('Unknown data store client');
        }
    }

    public async get(key: string): Promise<string | null> {
        return await this.client.get(this.prefix + key);
    }

    public async set(key: string, value: string): Promise<string> {
        return await this.client.set(this.prefix + key, value);
    }

    public async del(key: string): Promise<boolean> {
        return await this.client.del(this.prefix + key);
    }

    public async expire(key: string, seconds: number): Promise<boolean> {
        return await this.client.expire(this.prefix + key, seconds);
    }

    public async ttl(key: string): Promise<number> {
        return await this.client.ttl(this.prefix + key);
    }

    public async incr(key: string): Promise<number> {
        return await this.client.incr(this.prefix + key);
    }

    public async decr(key: string): Promise<number> {
        return await this.client.decr(this.prefix + key);
    }

    public async slice(list: string, start: number = 0, end: number = -1): Promise<string[]> {
        return await this.client.slice(this.prefix + list, start, end);
    }

    public async push(list: string, value: string): Promise<number> {
        return await this.client.push(this.prefix + list, value);
    }

    public async unshift(list: string, value: string): Promise<number> {
        return await this.client.unshift(this.prefix + list, value);
    }

    public async pop(list: string): Promise<string> {
        return await this.client.pop(this.prefix + list);
    }

    public async shift(list: string): Promise<string> {
        return await this.client.shift(this.prefix + list);
    }
}
