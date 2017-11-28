export default interface IDataStoreClient {
    get(key: string): Promise<string | null>;
    set(ket: string, value: string): Promise<string>;
    del(key: string): Promise<boolean>;
    expire(key: string, seconds: number): Promise<boolean>;
    ttl(key: string): Promise<number>;
    incr(key: string): Promise<number>;
    decr(key: string): Promise<number>;
    push(ket: string, value: string): Promise<number>;
    unshift(ket: string, value: string): Promise<number>;
    pop(key: string): Promise<string>;
    shift(key: string): Promise<string>;
    slice(key: string, start: number, end: number): Promise<string[]>;
}
