export interface IServerOptions {
    allowedOrigins?: (string | RegExp)[];
    host: string;
    logRequests: boolean;
    port: number;
    protocol?: 'http' | 'https';
}
