import { IHttpServerOptions } from '../server/http_options.interface';
import { IRpcServerOptions } from '../server/rpc_options.interface';

export interface IAppOptions {
    http?: IHttpServerOptions;
    name: string;
    rpc?: IRpcServerOptions;
}
