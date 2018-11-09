export interface IHttpServerOptions {
    allowedOrigins?: Array<string | RegExp>;
    host: string;
    port: number;
    protocol?: 'http' | 'https';
}
