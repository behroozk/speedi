import * as Logger from "console";
import * as redis from 'redis';

import { Config } from '../config/config';
import { IDataStoreClient } from './client.interface';

export class RedisClient implements IDataStoreClient {
    private client: redis.RedisClient | undefined;

    public async start(): Promise<void> {
        if (this.client) {
            return;
        }

        this.client = redis.createClient(Number(Config.redis.port), Config.redis.host);
    }

    public stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.client) {
                return reject("redis client is not initialized");
            }

            this.client.quit(this.callback<void>(resolve, reject));
            this.client = undefined;
        });
    }

    public get(key: string): Promise<string | null> {
        return new Promise((resolve, reject) => {
            if (!this.client) {
                return reject("redis client is not initialized");
            }

            this.client.get(key, this.callback<string>(resolve, reject));
        });
    }

    public set(key: string, value: string): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.client) {
                return reject("redis client is not initialized");
            }

            this.client.set(key, value, this.callback<string>(resolve, reject));
        });
    }

    public del(key: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this.client) {
                return reject("redis client is not initialized");
            }

            this.client.del(key, this.callback<boolean>(resolve, reject));
        });
    }

    public expire(key: string, seconds: number): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this.client) {
                return reject("redis client is not initialized");
            }

            this.client.expire(key, seconds, this.callback<number>(resolve, reject));
        });
    }

    public ttl(key: string): Promise<number> {
        return new Promise((resolve, reject) => {
            if (!this.client) {
                return reject("redis client is not initialized");
            }

            this.client.ttl(key, this.callback<number>(resolve, reject));
        });
    }

    public incr(key: string): Promise<number> {
        return new Promise((resolve, reject) => {
            if (!this.client) {
                return reject("redis client is not initialized");
            }

            this.client.incr(key, this.callback<number>(resolve, reject));
        });
    }

    public decr(key: string): Promise<number> {
        return new Promise((resolve, reject) => {
            if (!this.client) {
                return reject("redis client is not initialized");
            }

            this.client.decr(key, this.callback<number>(resolve, reject));
        });
    }

    public slice(list: string, start: number = 0, end: number = -1): Promise<string[]> {
        return new Promise((resolve, reject) => {
            if (!this.client) {
                return reject("redis client is not initialized");
            }

            this.client.lrange(list, start, end, this.callback<string[]>(resolve, reject));
        });
    }

    public push(list: string, value: string): Promise<number> {
        return new Promise((resolve, reject) => {
            if (!this.client) {
                return reject("redis client is not initialized");
            }

            this.client.rpush(list, value, this.callback<number>(resolve, reject));
        });
    }

    public unshift(list: string, value: string): Promise<number> {
        return new Promise((resolve, reject) => {
            if (!this.client) {
                return reject("redis client is not initialized");
            }

            this.client.lpush(list, value, this.callback<number>(resolve, reject));
        });
    }

    public pop(list: string): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.client) {
                return reject("redis client is not initialized");
            }

            this.client.rpop(list, this.callback<string>(resolve, reject));
        });
    }

    public shift(list: string): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.client) {
                return reject("redis client is not initialized");
            }

            this.client.lpop(list, this.callback<string>(resolve, reject));
        });
    }

    private callback<T>(
        resolve: (value?: any) => void,
        reject: (reason?: any) => void,
    ): any {
        return (error: Error | null, response: T) => {
            if (error) {
                reject(error);
                Logger.error(error);
            } else {
                resolve(response);
            }
        };
    }
}
