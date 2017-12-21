import { DataStore } from '../data_store/';
import { Logger } from '../logger/';
import { ICachedValue } from './value.interface';

export class Cacher {
    public static async retrieve(key: string): Promise<ICachedValue | null> {
        if (!Cacher.dataStore) {
            Cacher.dataStore = new DataStore('cache');
        }

        try {
            const value = await Cacher.dataStore.get(key);

            if (!value) {
                return null;
            } else {
                const cache = Cacher.parseCachedResponse(key, value);

                if (cache instanceof Error) {
                    return null;
                }

                return cache;
            }
        } catch (error) {
            Logger.error(error);
            return null;
        }
    }

    public static async store(key: string, value: ICachedValue, expire: number): Promise<boolean> {
        if (!Cacher.dataStore) {
            Cacher.dataStore = new DataStore('cache');
        }

        // TODO: combine set and expire in one method
        Cacher.dataStore.set(key, JSON.stringify(value));
        return Cacher.dataStore.expire(key, expire);
    }

    private static dataStore: DataStore;

    private static parseCachedResponse(key: string, cahcedValue: string): ICachedValue | Error {
        let parsedCachedValue: ICachedValue;

        try {
            parsedCachedValue = JSON.parse(cahcedValue);
            return parsedCachedValue;
        } catch (e) {
            Cacher.dataStore.del(key);
        }

        throw new Error('invalid cache');
    }
}
