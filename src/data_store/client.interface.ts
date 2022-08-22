export interface IDataStoreClient {
    start(): Promise<void>;
    stop(): Promise<void>;
    get(key: string): Promise<string | null>;
    set(ket: string, value: string): Promise<string | null>;
    del(key: string): Promise<boolean>;
    expire(key: string, seconds: number): Promise<boolean>;
    ttl(key: string): Promise<number>;
    incr(key: string): Promise<number>;
    decr(key: string): Promise<number>;
    push(ket: string, value: string): Promise<number>;
    unshift(ket: string, value: string): Promise<number>;
    pop(key: string): Promise<string | null>;
    shift(key: string): Promise<string | null>;
    slice(key: string, start: number, end: number): Promise<string[]>;
}
