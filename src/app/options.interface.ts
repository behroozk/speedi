import { IServerOptions } from '../server/http_options.interface';
import { ServerType } from '../server/type.enum';

export interface IAppOptions {
    httpOptions: IServerOptions;
    name: string;
    serverType: ServerType;
}
