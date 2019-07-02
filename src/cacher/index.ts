import { DataStore } from '../data_store/';
import { Logger } from '../logger/';
import { ICachedValue } from './value.interface';

let dataStore: DataStore | undefined;

export async function retrieve(key: string): Promise<ICachedValue | null> {
    try {
        if (!dataStore) {
            dataStore = new DataStore('cache');
        }

        const value = await dataStore.get(key);

        if (!value) {
            return null;
        } else {
            const cache = parseCachedResponse(key, value);

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

export function store(key: string, value: ICachedValue, expire: number): Promise<boolean> {
    if (!dataStore) {
        dataStore = new DataStore('cache');
    }

    // TODO: combine set and expire in one method
    dataStore.set(key, JSON.stringify(value));
    // expire is in ms, but redis uses seconds
    return dataStore.expire(key, Math.floor(expire / 1000));
}

function parseCachedResponse(key: string, cahcedValue: string): ICachedValue | Error {
    let parsedCachedValue: ICachedValue;

    try {
        parsedCachedValue = JSON.parse(cahcedValue);
        return parsedCachedValue;
    } catch (e) {
        if (!dataStore) {
            dataStore = new DataStore('cache');
        }

        dataStore.del(key);
    }

    throw new Error('invalid cache');
}
