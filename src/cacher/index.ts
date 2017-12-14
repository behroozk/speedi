import { DataStore } from '../data_store/';
import { Logger } from '../logger/';
import { ICachedValue } from "./value.interface";

export class Cacher {
    public static async retrieve(key: string): Promise<ICachedValue | null> {

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
        // TODO: combine set and expire in one method
        Cacher.dataStore.set(key, JSON.stringify(value));
        return Cacher.dataStore.expire(key, expire);
    }

    private static dataStore = new DataStore('cache');

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
