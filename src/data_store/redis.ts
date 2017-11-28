import * as redis from 'redis';
import CONFIG from '../config/config';
import Logger from '../logger/';
import IDataStoreClient from './client_interface';

export default class RedisClient implements IDataStoreClient {
    private client = redis.createClient(Number(CONFIG.redis.port), CONFIG.redis.host);

    public get(key: string): Promise<string | null> {
        return new Promise((resolve, reject) => {
            this.client.get(key, this.callback<string>(resolve, reject));
        });
    }

    public set(key: string, value: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.client.set(key, value, this.callback<string>(resolve, reject));
        });
    }

    public del(key: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.client.del(key, this.callback<boolean>(resolve, reject));
        });
    }

    public expire(key: string, seconds: number): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.client.expire(key, seconds, this.callback<number>(resolve, reject));
        });
    }

    public ttl(key: string): Promise<number> {
        return new Promise((resolve, reject) => {
            this.client.ttl(key, this.callback<number>(resolve, reject));
        });
    }

    public incr(key: string): Promise<number> {
        return new Promise((resolve, reject) => {
            this.client.incr(key, this.callback<number>(resolve, reject));
        });
    }

    public decr(key: string): Promise<number> {
        return new Promise((resolve, reject) => {
            this.client.decr(key, this.callback<number>(resolve, reject));
        });
    }

    public slice(list: string, start: number = 0, end: number = -1): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this.client.lrange(list, start, end, this.callback<string[]>(resolve, reject));
        });
    }

    public push(list: string, value: string): Promise<number> {
        return new Promise((resolve, reject) => {
            this.client.rpush(list, value, this.callback<number>(resolve, reject));
        });
    }

    public unshift(list: string, value: string): Promise<number> {
        return new Promise((resolve, reject) => {
            this.client.lpush(list, value, this.callback<number>(resolve, reject));
        });
    }

    public pop(list: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.client.rpop(list, this.callback<string>(resolve, reject));
        });
    }

    public shift(list: string): Promise<string> {
        return new Promise((resolve, reject) => {
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
