import * as Logger from "console";
import * as redis from "redis";

import { Config } from '../config/config';
import { IDataStoreClient } from './client.interface';

export class RedisClient implements IDataStoreClient {
    private client: redis.RedisClientType | undefined;

    public async start(): Promise<void> {
        if (this.client) {
            return;
        }

        this.client = redis.createClient({
            url: `redis://${Config.redis.host}:${Config.redis.port}`,
        });
    }

    public async stop(): Promise<void> {
        if (!this.client) {
            throw new Error("Redis client is not initialized");
        }

        try {
            return await this.client.quit();
        } catch {
            throw new Error("Unable to close redis client")
        }
    }

    public async get(key: string): Promise<string | null> {
        if (!this.client) {
            throw new Error("Redis client is not initialized");
        }

        try {
            return await this.client.get(key);
        } catch {
            return null;
        }
    }

    public async set(key: string, value: string): Promise<string | null> {
        if (!this.client) {
            throw new Error("Redis client is not initialized");
        }

        try {
            return await this.client.set(key, value);
        } catch {
            return null;
        }
    }

    public async del(key: string): Promise<boolean> {
        if (!this.client) {
            throw new Error("Redis client is not initialized");
        }

        try {
            return await this.client.del(key) > 0;
        } catch {
            return false;
        }
    }

    public async expire(key: string, seconds: number): Promise<boolean> {
        if (!this.client) {
            throw new Error("Redis client is not initialized");
        }

        try {
            return await this.client.expire(key, seconds);
        } catch {
            return false;
        }
    }

    public async ttl(key: string): Promise<number> {
        if (!this.client) {
            throw new Error("Redis client is not initialized");
        }

        return await this.client.ttl(key);
    }

    public async incr(key: string): Promise<number> {
        if (!this.client) {
            throw new Error("Redis client is not initialized");
        }

        return await this.client.incr(key);
    }

    public async decr(key: string): Promise<number> {
        if (!this.client) {
            throw new Error("Redis client is not initialized");
        }

        return await this.client.decr(key);
    }

    public async slice(list: string, start: number = 0, end: number = -1): Promise<string[]> {
        if (!this.client) {
            throw new Error("Redis client is not initialized");
        }

        return await this.client.lRange(list, start, end);
    }

    public async push(list: string, value: string): Promise<number> {
        if (!this.client) {
            throw new Error("Redis client is not initialized");
        }

        return await this.client.rPush(list, value);
    }

    public async unshift(list: string, value: string): Promise<number> {
        if (!this.client) {
            throw new Error("Redis client is not initialized");
        }

        return await this.client.lPush(list, value);
    }

    public async pop(list: string): Promise<string | null> {
        if (!this.client) {
            throw new Error("Redis client is not initialized");
        }

        return await this.client.rPop(list);
    }

    public async shift(list: string): Promise<string | null> {
        if (!this.client) {
            throw new Error("Redis client is not initialized");
        }

        return await this.client.lPop(list);
    }
}
