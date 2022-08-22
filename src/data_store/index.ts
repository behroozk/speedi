import * as Logger from "console";

import { Config } from '../config/config';
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
            throw new Error('unknown data store client');
        }
    }

    public start(): Promise<void> {
        return this.client.start();
    }

    public stop(): Promise<void> {
        return this.client.stop();
    }

    public get(key: string): Promise<string | null> {
        return this.client.get(this.prefix + key);
    }

    public set(key: string, value: string): Promise<string | null> {
        return this.client.set(this.prefix + key, value);
    }

    public del(key: string): Promise<boolean> {
        return this.client.del(this.prefix + key);
    }

    public expire(key: string, seconds: number): Promise<boolean> {
        return this.client.expire(this.prefix + key, seconds);
    }

    public ttl(key: string): Promise<number> {
        return this.client.ttl(this.prefix + key);
    }

    public incr(key: string): Promise<number> {
        return this.client.incr(this.prefix + key);
    }

    public decr(key: string): Promise<number> {
        return this.client.decr(this.prefix + key);
    }

    public slice(list: string, start: number = 0, end: number = -1): Promise<string[]> {
        return this.client.slice(this.prefix + list, start, end);
    }

    public push(list: string, value: string): Promise<number> {
        return this.client.push(this.prefix + list, value);
    }

    public unshift(list: string, value: string): Promise<number> {
        return this.client.unshift(this.prefix + list, value);
    }

    public pop(list: string): Promise<string | null> {
        return this.client.pop(this.prefix + list);
    }

    public shift(list: string): Promise<string | null> {
        return this.client.shift(this.prefix + list);
    }
}
